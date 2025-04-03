const express = require("express");
const Voiture = require("../../models/Voiture");
const Service = require("../../models/Service");
const Demande = require("../../models/Demande");
const Planning = require("../../models/Planning");
const router = express.Router();

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
