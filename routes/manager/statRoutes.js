const Mouvement = require("../../models/Mouvement");
const express = require("express");
const router = express.Router();

// Liste des pièces
router.get("/statCA", async (req, res) => {
    try {
      var bestFournisseur = await Mouvement.aggregate([
        { $match: { isEntree: true } }, // Filtrer uniquement les entrées
        {
          $group: {
            _id: "$fournisseur",
            totalPrix: {
              $sum: { $multiply: ["$prix", { $subtract: ["$nb", "$sortie"] }] },
            }, // Somme ((nb - sortie) * prix)
            totalQuantite: { $sum: { $subtract: ["$nb", "$sortie"] } }, // Somme (nb - sortie)
            totalSortie: { $sum: "$sortie" }, // Somme (sortie)
          },
        },
        {
          $lookup: {
            from: "fournisseurs", // Nom de la collection fournisseur
            localField: "_id",
            foreignField: "_id",
            as: "fournisseurDetails",
          },
        },
        { $unwind: "$fournisseurDetails" }, // Transformer l'array en objet
        {
          $addFields: {
            prixMoyenPondere: {
              $cond: {
                if: { $gt: ["$totalQuantite", 0] },
                then: { $divide: ["$totalPrix", "$totalQuantite"] },
                else: 0,
              },
            },
          },
        },
        { $sort: { prixMoyenPondere: 1 } }, // Trier par total croissant
        { $limit: 1 }, // Prendre le fournisseur avec le plus petit total
      ]);
      bestFournisseur = bestFournisseur.length > 0 ? bestFournisseur[0] : {};
    return res.status(200).json({ bestFournisseur });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur." });
  }
});

module.exports = router;