const express = require("express");
const Planning = require("../../models/Planning");
const mongoose = require("mongoose");
const router = express.Router();

// Récupérer les tâches à faire du mécanicien par ordre croissant
router.get("/getPlanning", async (req, res) => {
  try {
    const idMecanicien = req.idMecanicien;
    const page = parseInt(req.query.page) || 1;
    const size = 10;
    const skip = (page - 1) * size;
    const total = await Planning.countDocuments({
      mecanicien: idMecanicien,
      dateValidationTravail: null,
      // resteAFaire: { $ne: 0 },
    });
    const listPlanning = await Planning.find({
      mecanicien: idMecanicien,
      dateValidationTravail: null,
      // resteAFaire: { $ne: 0 },
    })
      .sort({ dateHeureDebut: 1 })
      .skip(skip)
      .limit(size)
      .populate("sousService");
    return res.status(200).json({ listPlanning, nbPlanning: total });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur." });
  }
});

// Update de planning
router.post("/updatePlanning", async (req, res) => {
  try {
    const idPlanning = req.body.idPlanning;
    const planning = await Planning.findById(idPlanning);
    planning.tempsPasse = req.body.tempsPasse;
    planning.resteAFaire = req.body.resteAFaire;
    await planning.save();
    return res.status(201).json({ message: "Planning mis à jour." });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Erreur lors de la mise à jour du planning." });
  }
});

// Statistique des performances
router.get("/getStatPerformance", async (req, res) => {
  try {
    const idMecanicien = req.idMecanicien;
    const anneeIntervention = Number(req.query.anneeIntervention);
    const anneeEtoile = Number(req.query.anneeEtoile);
    const etoiles = await Planning.aggregate([
      {
        $match: {
          mecanicien: new mongoose.Types.ObjectId(idMecanicien),
          dateValidationTravail: { $ne: null },
          nbEtoile: { $ne: null },
          dateHeureDebut: {
            $gte: new Date(`${anneeEtoile}-01-01`),
            $lte: new Date(`${anneeEtoile}-12-31`),
          },
        },
      },
      {
        $addFields: {
          mois: { $month: "$dateHeureDebut" },
          isFiveStar: { $cond: [{ $gte: ["$nbEtoile", 3] }, 1, 0] },
          isBadNote: { $cond: [{ $lte: ["$nbEtoile", 2] }, 1, 0] },
        },
      },
      {
        $group: {
          _id: "$mois",
          // moyenneEtoiles: { $avg: "$nbEtoile" },
          nombreBonneNote: { $sum: "$isFiveStar" },
          nombreMauvaisesNotes: { $sum: "$isBadNote" },
        },
      },
    ]);

    const moisLabels = Array.from({ length: 12 }, (_, i) => i + 1);
    const statEtoile = [];

    for (const mois of moisLabels) {
      const match = etoiles.find((e) => e._id === mois);
      statEtoile.push({
        mois,
        // moyenneEtoiles: match ? match.moyenneEtoiles : 0,
        nombreBonneNote: match ? match.nombreBonneNote : 0,
        nombreMauvaisesNotes: match ? match.nombreMauvaisesNotes : 0,
      });
    }

    const stats = await Planning.aggregate([
      {
        $match: {
          mecanicien: new mongoose.Types.ObjectId(idMecanicien),
          dateValidationTravail: { $ne: null },
          dateHeureDebut: {
            $gte: new Date(`${anneeIntervention}-01-01`),
            $lte: new Date(`${anneeIntervention}-12-31`),
          },
        },
      },
      {
        $addFields: {
          mois: { $month: "$dateHeureDebut" },
          aTemps: {
            $cond: [{ $eq: ["$tempsPasse", "$estimationTotal"] }, 1, 0],
          },
          enAvance: {
            $cond: [{ $lt: ["$tempsPasse", "$estimationTotal"] }, 1, 0],
          },
          enRetard: {
            $cond: [{ $gt: ["$tempsPasse", "$estimationTotal"] }, 1, 0],
          },
        },
      },
      {
        $group: {
          _id: "$mois",
          aTemps: { $sum: "$aTemps" },
          enAvance: { $sum: "$enAvance" },
          enRetard: { $sum: "$enRetard" },
        },
      },
    ]);

    const statPerformance = [];

    for (const mois of moisLabels) {
      const match = stats.find((s) => s._id === mois);
      statPerformance.push({
        mois,
        aTemps: match ? match.aTemps : 0,
        enAvance: match ? match.enAvance : 0,
        enRetard: match ? match.enRetard : 0,
      });
    }

    res.status(201).json({ statPerformance, statEtoile });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur." });
  }
});

// Statistique des interventions du mécanicien connecté
router.get("/getStatIntervention", async (req, res) => {
  try {
    const idMecanicien = req.idMecanicien;
    const anneeIntervention = Number(req.query.anneeIntervention);
    const moisLabels = Array.from({ length: 12 }, (_, i) => i + 1);
    const stats = await Planning.aggregate([
      {
        $match: {
          mecanicien: new mongoose.Types.ObjectId(idMecanicien),
          dateValidationTravail: { $ne: null },
          dateHeureDebut: {
            $gte: new Date(`${anneeIntervention}-01-01`),
            $lte: new Date(`${anneeIntervention}-12-31`),
          },
        },
      },
      {
        $addFields: {
          mois: { $month: "$dateHeureDebut" },
          aTemps: {
            $cond: [{ $eq: ["$tempsPasse", "$estimationTotal"] }, 1, 0],
          },
          enAvance: {
            $cond: [{ $lt: ["$tempsPasse", "$estimationTotal"] }, 1, 0],
          },
          enRetard: {
            $cond: [{ $gt: ["$tempsPasse", "$estimationTotal"] }, 1, 0],
          },
        },
      },
      {
        $group: {
          _id: "$mois",
          aTemps: { $sum: "$aTemps" },
          enAvance: { $sum: "$enAvance" },
          enRetard: { $sum: "$enRetard" },
        },
      },
    ]);

    const statPerformance = [];

    for (const mois of moisLabels) {
      const match = stats.find((s) => s._id === mois);
      statPerformance.push({
        mois,
        aTemps: match ? match.aTemps : 0,
        enAvance: match ? match.enAvance : 0,
        enRetard: match ? match.enRetard : 0,
      });
    }

    res.status(200).json({ statPerformance });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur." });
  }
});

// Statistique des étoiles
router.get("/getStatEtoile", async (req, res) => {
  try {
    const idMecanicien = req.idMecanicien;
    const anneeEtoile = Number(req.query.anneeEtoile);
    const etoiles = await Planning.aggregate([
      {
        $match: {
          mecanicien: new mongoose.Types.ObjectId(idMecanicien),
          dateValidationTravail: { $ne: null },
          nbEtoile: { $ne: null },
          dateHeureDebut: {
            $gte: new Date(`${anneeEtoile}-01-01`),
            $lte: new Date(`${anneeEtoile}-12-31`),
          },
        },
      },
      {
        $addFields: {
          mois: { $month: "$dateHeureDebut" },
          isFiveStar: { $cond: [{ $gte: ["$nbEtoile", 3] }, 1, 0] },
          isBadNote: { $cond: [{ $lte: ["$nbEtoile", 2] }, 1, 0] },
        },
      },
      {
        $group: {
          _id: "$mois",
          // moyenneEtoiles: { $avg: "$nbEtoile" },
          nombreBonneNote: { $sum: "$isFiveStar" },
          nombreMauvaisesNotes: { $sum: "$isBadNote" },
        },
      },
    ]);

    const moisLabels = Array.from({ length: 12 }, (_, i) => i + 1);
    const statEtoile = [];

    for (const mois of moisLabels) {
      const match = etoiles.find((e) => e._id === mois);
      statEtoile.push({
        mois,
        // moyenneEtoiles: match ? match.moyenneEtoiles : 0,
        nombreBonneNote: match ? match.nombreBonneNote : 0,
        nombreMauvaisesNotes: match ? match.nombreMauvaisesNotes : 0,
      });
    }

    res.status(201).json({ statEtoile });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur." });
  }
});

module.exports = router;
