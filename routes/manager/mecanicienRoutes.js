const express = require("express");
const Planning = require("../../models/Planning");
const Demande = require("../../models/Demande");
const Mecanicien = require("../../models/Mecanicien");
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
          nombreInterventionsFinis: {
            $sum: {
              $cond: [{ $ne: ["$dateValidationTravail", null] }, 1, 0],
            },
          },  
          nombreInterventionsEnCours: {
            $sum: {
              $cond: [{ $eq: ["$dateValidationTravail", null] }, 1, 0],
            },
          },                 
          // nombreInterventions: { $sum: 1 }, // Nombre total d’interventions
          delaiMoyen: { $avg: "$tempsPasse" }, // Délai moyen de réalisation
          tauxRespectEstimation: {
            $avg: {
              $multiply: [
                {
                  $cond: [
                    { $eq: ["$tempsPasse", 0] }, // Si tempsPasse == 0
                    0,                            // retourne 0
                    { $divide: ["$estimationTotal", "$tempsPasse"] } // sinon, division normale
                  ]
                },
                100
              ]
            }
          },           // Taux de respect des estimations de temps
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

// Liste des tâches d'un mécanicien à valider
router.get("/listeTacheAValider", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const size = 10;
    const skip = (page - 1) * size;
    const idMecanicien = req.query.idMecanicien;
    const mecanicien = await Mecanicien.findById(idMecanicien).populate("user");
    const total = await Planning.countDocuments(
      { mecanicien: idMecanicien, resteAFaire: 0, dateValidationTravail: null }
    );
    const planning = await Planning.find({ mecanicien: idMecanicien, resteAFaire:0, dateValidationTravail : null })
      .skip(skip)
      .limit(size).populate("sousService");
    res.status(201).json({ mecanicien, planning, nbTaches: total });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur." });
  }
});

// Valider un planning
router.post("/validerPlanning", async (req, res) => {
  try {
    const idPlanning = req.body.idPlanning;
    const tempsPasse = req.body.tempsPasse;
    const resteAFaire = req.body.resteAFaire;
    const planning = await Planning.findById(idPlanning);
    planning.tempsPasse = tempsPasse;
    planning.resteAFaire = resteAFaire;
    if(planning.resteAFaire === 0) planning.dateValidationTravail = new Date();
    await planning.save();
    const otherPlanning = await Planning.find({ demande: planning.demande, dateValidationTravail: null });
    if(otherPlanning.length === 0) {
      const demande = await Demande.findById(planning.demande);
      demande.dateValidationTravail = new Date();
      await demande.save();
    }
    res.status(201).json({ message: "Planning validé." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur." });
  }
});

module.exports = router;
