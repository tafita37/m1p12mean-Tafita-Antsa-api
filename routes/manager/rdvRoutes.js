const express = require("express");
const Demande = require("../../models/Demande");
const Mecanicien = require("../../models/Mecanicien");
const DetailPiece = require("../../models/DetailPiece");
const Mouvement = require("../../models/Mouvement");
const Fournisseur = require("../../models/Fournisseur");
const SousService = require("../../models/SousService");
const Planning = require("../../models/Planning");
const Facture = require("../../models/Facture");
const FactureDetail = require("../../models/FactureDetail");
const router = express.Router();

// Récupérer les rendez-vous non-valider
router.get("/allRdvNV", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const size = 10;
    const skip = (page - 1) * size;
    const total = await Demande.countDocuments({
      dateValidation: null,
      dateRefus: null,
    });
    const listDemande = await Demande.find({
      dateValidation: null,
      dateRefus: null,
    })
      .populate({
        path: "voiture",
        populate: {
          path: "client",
          populate: {
            path: "user",
            select: "-mdp",
          },
        },
      })
      .populate("details.service")
      .skip(skip)
      .limit(size);
    return res.status(200).json({ listDemande, nbRDVNv: total });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur." });
  }
});

// Récupérer un rendez-vous spécifique
router.get("/allDataValidation", async (req, res) => {
  try {
    const idDemande = req.query.idDemande;
    const demande = await Demande.findById(idDemande)
      .populate({
        path: "voiture",
        populate: {
          path: "client",
        },
      })
      .populate({
        path: "details.details.sousService",
        populate: {
          path: "pieces",
          populate: {
            path: "piece",
          },
        },
      });
    const dateDemande = demande.date;
    const allMecanicien = await Mecanicien.find().populate({
      path: "user",
      select: "-mdp",
    });

    const allFournisseur = await Fournisseur.find();

    const allSous = demande.details.details;
    const idMarque = demande.voiture.marque;
    let pieceKeyList = {};
    let listPiece = [];
    let listeAVendre = [];
    for (let i = 0; i < allSous.length; i++) {
      for (let j = 0; j < allSous[i].sousService.pieces.length; j++) {
        if (allSous[i].sousService.pieces[j].etat == 1) {
          if (!pieceKeyList[allSous[i].sousService.pieces[j].piece._id]) {
            pieceKeyList[allSous[i].sousService.pieces[j].piece._id] = {
              piece: allSous[i].sousService.pieces[j].piece,
              quantite: allSous[i].qte,
            };
          } else {
            pieceKeyList[allSous[i].sousService.pieces[j].piece._id].quantite +=
              allSous[i].qte;
          }
        }
      }
    }
    for (let idPiece in pieceKeyList) {
      listeAVendre.push({
        piece: pieceKeyList[idPiece].piece,
        quantite: pieceKeyList[idPiece].quantite,
        prix: 0,
      });
      let detailPiece = await DetailPiece.findOne({
        piece: idPiece,
        marque: idMarque,
      });
      console.log(detailPiece);

      if (!detailPiece) {
        detailPiece = new DetailPiece({
          piece: idPiece,
          marque: idMarque,
        });
        await detailPiece.save();
      }
      let result = await Mouvement.aggregate([
        {
          $match: {
            detailPiece: detailPiece._id,
            dateMouvement: { $lte: dateDemande }, // on filtre les mouvements jusqu'à la date donnée
          },
        },
        {
          $addFields: {
            sortieFiltrees: {
              $filter: {
                input: "$sortie",
                as: "s",
                cond: {
                  $and: [
                    { $lte: ["$$s.dateMouvement", dateDemande] },
                    // si tu veux filtrer par type, ajoute ici par ex:
                    // { $eq: ["$$s.type", "tonTypeSouhaité"] }
                  ],
                },
              },
            },
          },
        },
        {
          $addFields: {
            totalSortie: { $sum: "$sortieFiltrees.nb" },
          },
        },
        {
          $addFields: {
            disponible: { $subtract: ["$nb", "$totalSortie"] },
          },
        },
        {
          $group: {
            _id: "$detailPiece",
            totalDisponible: { $sum: "$disponible" },
          },
        },
      ]);
      if (result.length > 0) {
        if (result[0].totalDisponible < pieceKeyList[idPiece].quantite) {
          pieceKeyList[idPiece].disponible =
            pieceKeyList[idPiece].quantite - result[0].totalDisponible;
          listPiece.push(pieceKeyList[idPiece]);
        }
      } else {
        listPiece.push(pieceKeyList[idPiece]);
      }
    }

    return res
      .status(200)
      .json({
        demande,
        allMecanicien,
        listPiece,
        allFournisseur,
        listeAVendre,
      });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur." });
  }
});

// Valider un rendez-vous
router.post("/validerRDV", async (req, res) => {
  try {
    const idDemande = req.body.idDemande;
    const planning = req.body.planning;
    const listeAVendre = req.body.listeAVendre;
    let facture = new Facture({ demande: idDemande, dateFacture: new Date() });
    let montantTotal = 0;
    let detailFacturesAchat = {};
    for (let i = 0; i < listeAVendre.length; i++) {
      detailFacturesAchat[listeAVendre[i].piece._id] = listeAVendre[i];
    }
    for (let i = 0; i < planning.length; i++) {
      const sousService = await SousService.findById(planning[i].sous).populate(
        "pieces.piece"
      );
      for (let j = 0; j < sousService.pieces.length; j++) {
        if (sousService.pieces[j].etat == 1) {
          let detailFacture = new FactureDetail({
            description: "Remplacement de " + sousService.pieces[j].piece.nom,
            quantite: planning[i].qte,
            prixUnitaire: sousService.pieces[j].piece.prixRemplacement,
          });
          montantTotal += detailFacture.prixUnitaire * detailFacture.quantite;
          let achat = new FactureDetail({
            description: "Achat de " + sousService.pieces[j].piece.nom,
            quantite: planning[i].qte,
            prixUnitaire:
              detailFacturesAchat[sousService.pieces[j].piece._id].prix,
          });
          montantTotal += achat.prixUnitaire * achat.quantite;
          achat.save();
          detailFacture.save();
          facture.factureDetail.push(achat);
          facture.factureDetail.push(detailFacture);
        } else {
          let detailFacture = new FactureDetail({
            description: "Réparation de " + sousService.pieces[j].piece.nom,
            quantite: planning[i].qte,
            prixUnitaire: sousService.pieces[j].piece.prixReparation,
          });
          montantTotal += detailFacture.prixUnitaire * detailFacture.quantite;
          detailFacture.save();
          facture.factureDetail.push(detailFacture);
        }
      }
      let detailFacture = new FactureDetail({
        description: sousService.nom,
        quantite: planning[i].qte,
        prixUnitaire: sousService.prix,
      });
      montantTotal += detailFacture.prixUnitaire * detailFacture.quantite;
      detailFacture.save();
      facture.factureDetail.push(detailFacture);
      const newPlanning = new Planning({
        demande: idDemande,
        sousService: planning[i].sous,
        mecanicien: planning[i].mecanicien,
        qte: planning[i].qte,
        dateHeureDebut: planning[i].dateHeureDebut,
        estimationTotal: sousService.dureeMinute * planning[i].qte,
        resteAFaire: sousService.dureeMinute * planning[i].qte,
      });
      await newPlanning.save();
    }
    const demande = await Demande.findById(idDemande);
    demande.dateValidation = Date.now();
    await demande.save();
    facture.montantTotal = montantTotal;
    await facture.save();
    res.status(201).json({ message: "Rendez-vous validé." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la validation du rendez-vous." });
    console.error(error);
  }
});

// Refuser un rendez-vous
router.post("/refuserRDV", async (req, res) => {
  try {
    const idDemande = req.body.idDemande;
    const demande = await Demande.findById(idDemande);
    demande.dateRefus = Date.now();
    await demande.save();
    res.status(201).json({ message: "Rendez-vous refusé." });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors du refus du rendez-vous." });
    console.error(error);
  }
});

module.exports = router;
