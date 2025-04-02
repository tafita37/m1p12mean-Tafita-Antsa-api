const express = require("express");
const Demande = require("../../models/Demande");
const Mecanicien = require("../../models/Mecanicien");
const DetailPiece = require("../../models/DetailPiece");
const Mouvement = require("../../models/Mouvement");
const Fournisseur = require("../../models/Fournisseur");
const SousService = require("../../models/SousService");
const Planning = require("../../models/Planning");
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
    const allMecanicien = await Mecanicien.find().populate({
      path: "user",
      select: "-mdp",
    });

    const allFournisseur = await Fournisseur.find();

    const allSous = demande.details.details;
    const idMarque = demande.voiture.marque;
    let pieceKeyList = {};
    let listPiece = [];
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
        { $match: { detailPiece: detailPiece._id } },
        { $addFields: { disponible: { $subtract: ["$nb", "$sortie"] } } },
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
      .json({ demande, allMecanicien, listPiece, allFournisseur });
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
    for (let i = 0; i < planning.length; i++) {
      console.log(planning[i].dateHeureDebut);
      
      const sousService = await SousService.findById(planning[i].sous);
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
    res
      .status(500)
      .json({ message: "Erreur lors du refus du rendez-vous." });
    console.error(error);
  }
});

module.exports = router;
