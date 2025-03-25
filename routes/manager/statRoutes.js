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

      const anneeCA = parseInt(req.query.anneeCA);
      if (isNaN(anneeCA)) {
        return res
          .status(400)
          .json({ message: "L'année doit être un nombre valide" });
      }

      const dateFin =
        req.query.anneeCA && req.query.anneeCA != "null"
          ? new Date(req.query.dateFin)
          : null;

      var statPiece = await Mouvement.aggregate([
        {
          $match: {
            dateMouvement: {
              $gte: new Date(anneeCA, 0, 1), // 1er janvier de l'année
              $lt: new Date(anneeCA + 1, 0, 1), // 1er janvier de l'année suivante
            },
            isEntree: false,
          },
        },
        {
          $project: {
            mois: { $month: "$dateMouvement" },
            calcul: { $multiply: ["$prix", { $subtract: ["$nb", "$sortie"] }] },
          },
        },
        {
          $group: {
            _id: "$mois",
            total: { $sum: "$calcul" },
          },
        },
        {
          $sort: { _id: 1 }, // Trier par mois croissant
        },
      ]);

      const allMonths = Array.from({ length: 12 }, (_, i) => ({
        _id: i + 1,
        total: 0,
      }));
      // 3. Fusion des résultats avec le template
      statPiece = allMonths.map((month) => {
        const existingMonth = statPiece.find((item) => item._id === month._id);
        return existingMonth || month;
      });

      // 4. Tri par mois (normalement déjà ordonné mais au cas où)
      // statPiece.sort((a, b) => a._id - b._id);
      return res.status(200).json({ bestFournisseur, statPiece });
    } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur." });
  }
});

module.exports = router;