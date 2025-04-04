const express = require("express");
const Voiture = require("../../models/Voiture");
const Service = require("../../models/Service");
const Demande = require("../../models/Demande");
const Planning = require("../../models/Planning");
const router = express.Router();
const PDFDocument = require("pdfkit");
const fs = require("fs");
const Facture = require("../../models/Facture");
const Client = require("../../models/Client");

const formatNumber = (num) => {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

// Formatage des quantités (pas de décimales)
const formatQuantity = (num) => {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

// Formatage monétaire (avec symbole €)
const formatMoney = (num) => {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

// Facture en pdf
router.get("/pdfFacture", async (req, res) => {
  try {
    const idDemande = req.query.idDemande;
    console.log(idDemande);
    
    const facture = await Facture.findOne({demande : idDemande}).populate("factureDetail");
    const idClient = req.idClient;
    const client=await Client.findById(idClient).populate("user");
    const factureData = {
      numero: "FAC-"+facture.dateFacture.getFullYear()+"-"+facture.numeroFacture,
      date: new Date().toLocaleDateString(),
      client: {
        nom: client.user.nom+" "+client.user.prenom,
      },
      lignes: [
        { description: "Produit 1", quantite: 2, prix: 50, total: 100 },
        { description: "Produit 2", quantite: 1, prix: 75, total: 75 },
      ],
      total: 175,
    };

    const doc = new PDFDocument({ margin: 50 });
    const filename = `facture_${factureData.numero}.pdf`;

    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    // En-tête de la facture
    doc.fontSize(20).text("FACTURE", { align: "center" });
    doc.moveDown();

    // Infos facture
    doc
      .fontSize(10)
      .text(`N°: ${factureData.numero}`, { continued: true, align: "left" })
      .text(`Date: ${factureData.date}`, { align: "right" });
    doc.moveDown();

    // Client
    doc.text(`Client: ${factureData.client.nom}`);
    doc.moveDown(2);

    // Configuration du tableau
    const tableTop = doc.y;
    const descriptionX = 100;
    const quantityX = 250;
    const priceX = 300;
    const totalX = 400;

    // En-têtes du tableau
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("Description", descriptionX, tableTop)
      .text("Qté", quantityX, tableTop)
      .text("Prix", priceX, tableTop)
      .text("Total", totalX, tableTop)
      .moveDown();

    // Ligne séparatrice
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    let totalFacture = 0;

    // Contenu du tableau
    let y = doc.y;
    facture.factureDetail.forEach((item, i) => {
      item.total = item.prixUnitaire * item.quantite;
      totalFacture+=item.total;
      doc
        .font("Helvetica")
        .fontSize(10)
        .text(item.description, descriptionX, y)
        .text(item.quantite.toString(), quantityX, y, {
          width: 40,
          align: "right",
        })
        .text(`${item.prixUnitaire.toFixed(2)} Ar`, priceX, y, {
          width: 60,
          align: "right",
        })
        .text(`${item.total.toFixed(2)} Ar`, totalX, y, {
          width: 60,
          align: "right",
        });

      y += 20; // Espacement entre lignes
      doc.y = y;
    });

    // Ligne séparatrice finale
    doc.moveTo(50, y).lineTo(550, y).stroke();
    doc.moveDown();

    // Total
    doc
      .font("Helvetica-Bold")
      .text(`Total: ${totalFacture.toFixed(2)} Ar`, { align: "right" });

    doc.end();
  } catch (error) {
    console.error("Erreur génération PDF:", error);
    res.status(500).send("Erreur lors de la génération du PDF");
  }
});

// Toutes les données pour le rendez-vous
router.get("/allData", async (req, res) => {
  try {
    const idClient = req.idClient;
    const listVoiture = await Voiture.find({ client: idClient });
    const allService = await Service.find().populate("sousServices");
    const allPlanning = await Planning.find()
      .populate({
        path: "demande",
        populate: {
          path: "voiture",
          match: { client: idClient },
        },
      })
      .populate("sousService")
      .populate({
        path: "mecanicien",
        populate: {
          path: "user",
        },
      });
    return res.status(200).json({ listVoiture, allService, allPlanning });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur." });
  }
});

// Création d'un rendez-vous
router.post("/newRDV", async (req, res) => {
  try {
    const idVoiture = req.body.idVoiture;
    const idService = req.body.idService;
    const details = req.body.details;
    console.log(details);
    
    const dates = req.body.dates;
    const demande = new Demande({
      voiture: idVoiture,
      details: {
        service: idService,
        details: details,
      },
      date: dates,
    });
    await demande.save();
    return res
      .status(201)
      .json({
        message:
          "Votre demande a bien été envoyée. Veuillez attendre la validation.",
      });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Erreur lors de l'insertion de la demande." });
  }
});

// Liste des voitures encore en cours de service
router.get("/voitureEnCours", async (req, res) => {
  try {
    const idClient = req.idClient;
    const listeVoitures = await Planning.aggregate([
      // Jointure avec Demande
      {
        $lookup: {
          from: "demandes",
          localField: "demande",
          foreignField: "_id",
          as: "demandeDetails",
        },
      },
      { $unwind: "$demandeDetails" },

      // Jointure avec Voiture
      {
        $lookup: {
          from: "voitures",
          localField: "demandeDetails.voiture",
          foreignField: "_id",
          as: "voitureDetails",
        },
      },
      { $unwind: "$voitureDetails" },

      // Filtrer sur le client spécifique
      {
        $match: {
          "voitureDetails.client": idClient, // Vérifie si la voiture appartient au client donné
        },
      },

      // Regroupement par voiture
      {
        $group: {
          _id: "$voitureDetails._id",
          voiture: { $first: "$voitureDetails" },
          demandeId: { $first: "$demandeDetails._id" },
          totalResteAFaire: { $sum: "$resteAFaire" },
          totalTempsPasse: { $sum: "$tempsPasse" },
          totalEstimation: { $sum: "$estimationTotal" },
        },
      },

      // Filtrer les voitures où sum(resteAFaire) != 0
      {
        $match: {
          $or: [
            { "demandeDetails.dateValidationTravail": { $eq: null } },
            { totalResteAFaire: { $eq: 0 } },
          ],
        },
      },

      // Calculer le ratio progression = sum(tempsPasse) / (sum(estimationTotal) + sum(resteAFaire))
      {
        $addFields: {
          progression: {
            $cond: {
              if: {
                $gt: [{ $add: ["$totalEstimation", "$totalResteAFaire"] }, 0],
              },
              then: {
                $divide: [
                  "$totalTempsPasse",
                  { $add: ["$totalTempsPasse", "$totalResteAFaire"] },
                ],
              },
              else: 0,
            },
          },
        },
      },
    ]);

    return res.status(200).json({listeVoitures});
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur." });
  }
});

// Liste des plannings en cours d'une voiture
router.get("/planningOfDemande", async (req, res) => {
  try {
    const idDemande = req.query.idDemande;
    const demande = await Demande.findById(idDemande);
    const plannings = await Planning.find({ demande: idDemande })
      .sort({
        dateHeureDebut: 1,
      })
      .populate("sousService").populate("demande");
    return res.status(200).json({ plannings, demande });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur." });
  }
});

// Noter un planning
router.post("/noterPlanning", async (req, res) => {
  try {
    const idPlanning = req.body.idPlanning;
    const nbEtoile = req.body.nbEtoile;
    const planning = await Planning.findById(idPlanning);
    planning.nbEtoile = nbEtoile;
    await planning.save();
    return res
      .status(201)
      .json({
        message:
          "Note enregistrée.",
      });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Erreur lors de la notation." });
  }
});

module.exports = router;
