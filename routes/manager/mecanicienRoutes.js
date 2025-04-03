const express = require("express");
const Planning = require("../../models/Planning");
const router = express.Router();

// Récupérer les performances des mécaniciens
router.post("/getPerformance", async (req, res) => {
  try {
    const mois = req.body.mois;
    const annee = req.body.annee;
    const statsParMecanicien = await Planning.aggregate([
      {
        $match: {
          $expr: {
            $cond: [
              // Cas 1: Année seule spécifiée
              { $and: [{ $eq: [mois, null] }, { $ne: [annee, null] }] },
              { $eq: [{ $year: "$dateHeureDebut" }, annee] },

              // Cas 2: Mois+Année spécifiés
              {
                $cond: [
                  { $and: [{ $ne: [mois, null] }, { $ne: [annee, null] }] },
                  {
                    $and: [
                      { $eq: [{ $month: "$dateHeureDebut" }, mois] },
                      { $eq: [{ $year: "$dateHeureDebut" }, annee] },
                    ],
                  },
                  // Cas 3: Mois seul ou aucun - pas de filtre
                  true,
                ],
              },
            ],
          },
        },
      },
      {
        $lookup: {
          from: "mecaniciens",
          localField: "mecanicien",
          foreignField: "_id",
          as: "mecanicienDetails",
        },
      },
      { $unwind: "$mecanicienDetails" },
      // Jointure avec User (Populate du mécanicien → user)
      {
        $lookup: {
          from: "users",
          localField: "mecanicienDetails.user",
          foreignField: "_id",
          as: "mecanicienDetails.user",
        },
      },
      { $unwind: "$mecanicienDetails.user" }, // Unwind pour éviter le tableau
      {
        $project: {
          "mecanicienDetails.user.mdp": 0, // Supprime ce champ de la sortie
        },
      },
      {
        $group: {
          _id: "$mecanicien",
          mecanicien: { $first: "$mecanicienDetails" }, // Récupération des détails du mécanicien
          nombreInterventions: { $sum: 1 }, // Nombre total d’interventions
          delaiMoyen: { $avg: "$tempsPasse" }, // Délai moyen de réalisation
          tauxRespectEstimation: {
            $avg: {
              $multiply: [
                { $divide: ["$estimationTotal", "$tempsPasse"] },
                100,
              ],
            },
          }, // Taux de respect des estimations de temps
          moyenneEtoiles: {
            $avg: {
              $cond: [{ $ne: ["$nbEtoile", null] }, "$nbEtoile", "$$REMOVE"],
            },
          }, // Moyenne des étoiles (excluant les nulls)
        },
      },
    ]);

    return res.status(200).json({ statsParMecanicien });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur." });
  }
});

module.exports = router;
