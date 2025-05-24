const Mouvement = require("../../models/Mouvement");
const express = require("express");
const Planning = require("../../models/Planning");
const Demande = require("../../models/Demande");
const router = express.Router();

router.get("/statCA", async (req, res) => {
  try {
    var bestFournisseur = await Mouvement.aggregate([
      { $match: { isEntree: true } },

      // Déplier les sous-documents de sortie
      {
        $unwind: {
          path: "$sortie",
          preserveNullAndEmptyArrays: true,
        },
      },

      // Grouper par mouvement pour calculer totalSortie (par mouvement)
      {
        $group: {
          _id: "$_id",
          fournisseur: { $first: "$fournisseur" },
          prix: { $first: "$prix" },
          nb: { $first: "$nb" },
          totalSortieParMouvement: { $sum: "$sortie.nb" }, // somme sortie.nb
        },
      },

      // Recalculer totalQuantite pour chaque mouvement
      {
        $project: {
          fournisseur: 1,
          prix: 1,
          nb: 1,
          totalSortieParMouvement: 1,
          quantiteRestante: { $subtract: ["$nb", "$totalSortieParMouvement"] },
          totalPrixRestant: {
            $multiply: [
              "$prix",
              { $subtract: ["$nb", "$totalSortieParMouvement"] },
            ],
          },
        },
      },

      // Grouper par fournisseur pour cumuler les données
      {
        $group: {
          _id: "$fournisseur",
          totalQuantite: { $sum: "$quantiteRestante" },
          totalSortie: { $sum: "$totalSortieParMouvement" },
          totalPrix: { $sum: "$totalPrixRestant" },
        },
      },

      // Lookup pour récupérer les infos du fournisseur
      {
        $lookup: {
          from: "fournisseurs",
          localField: "_id",
          foreignField: "_id",
          as: "fournisseurDetails",
        },
      },
      { $unwind: "$fournisseurDetails" },

      // Ajout du prix moyen pondéré
      {
        $addFields: {
          prixMoyenPondere: {
            $cond: [
              { $gt: ["$totalQuantite", 0] },
              { $divide: ["$totalPrix", "$totalQuantite"] },
              0,
            ],
          },
        },
      },

      { $sort: { prixMoyenPondere: 1 } },
      { $limit: 1 },
    ]);

    bestFournisseur = bestFournisseur.length > 0 ? bestFournisseur[0] : {};

    const anneeClient = parseInt(
      req.query.anneeClient || new Date().getFullYear()
    );
    if (isNaN(anneeClient)) {
      return res
        .status(400)
        .json({ message: "L'année doit être un nombre valide" });
    }

    const topClients = await Demande.aggregate([
      {
        $match: {
          dateValidation: {
            $ne: null,
            $gte: new Date(`${anneeClient}-01-01T00:00:00.000Z`),
            $lt: new Date(`${anneeClient + 1}-01-01T00:00:00.000Z`),
          },
        },
      },
      {
        $lookup: {
          from: "voitures",
          localField: "voiture",
          foreignField: "_id",
          as: "voiture",
        },
      },
      { $unwind: "$voiture" },
      {
        $lookup: {
          from: "clients",
          localField: "voiture.client",
          foreignField: "_id",
          as: "client",
        },
      },
      { $unwind: "$client" },
      {
        $lookup: {
          from: "users",
          localField: "client.user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $group: {
          _id: "$user._id",
          nom: { $first: "$user.nom" },
          prenom: { $first: "$user.prenom" },
          email: { $first: "$user.email" },
          nbDemandesValidees: { $sum: 1 },
        },
      },
      { $sort: { nbDemandesValidees: -1 } },
      { $limit: 5 },
    ]);

    const anneeCA = parseInt(req.query.anneeCA || new Date().getFullYear());
    if (isNaN(anneeCA)) {
      return res
        .status(400)
        .json({ message: "L'année doit être un nombre valide" });
    }

    var statPiece = await Mouvement.aggregate([
      {
        $match: {
          isEntree: false,
          dateMouvement: {
            $gte: new Date(anneeCA, 0, 1),
            $lt: new Date(anneeCA + 1, 0, 1),
          },
        },
      },
      {
        $project: {
          mois: { $month: "$dateMouvement" },
          calcul: { $multiply: ["$prix", "$nb"] },
        },
      },
      {
        $group: {
          _id: "$mois",
          total: { $sum: "$calcul" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    var statService = await Planning.aggregate([
      {
        $match: {
          dateHeureDebut: {
            $gte: new Date(anneeCA, 0, 1), // 1er janvier
            $lt: new Date(anneeCA + 1, 0, 1), // 1er janvier année suivante
          },
        },
      },
      {
        $lookup: {
          from: "sousservices", // nom de la collection
          localField: "sousService",
          foreignField: "_id",
          as: "sousService",
        },
      },
      { $unwind: "$sousService" },
      {
        $project: {
          mois: { $month: "$dateHeureDebut" }, // extrait le mois
          total: { $multiply: ["$qte", "$sousService.prix"] },
        },
      },
      {
        $group: {
          _id: "$mois", // grouper par mois
          total: { $sum: "$total" },
        },
      },
      { $sort: { _id: 1 } }, // trier par mois croissant
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

    // 4. Fusion des résultats avec le template
    statService = allMonths.map((month) => {
      const existingMonth = statService.find((item) => item._id === month._id);
      return existingMonth || month;
    });

    const bestClient = await Planning.aggregate([
      // Jointure avec Demande pour remonter jusqu'à la voiture (et donc le client)
      {
        $lookup: {
          from: "demandes",
          localField: "demande",
          foreignField: "_id",
          as: "demande",
        },
      },
      { $unwind: "$demande" },

      // Jointure avec Voiture
      {
        $lookup: {
          from: "voitures",
          localField: "demande.voiture",
          foreignField: "_id",
          as: "voiture",
        },
      },
      { $unwind: "$voiture" },

      // Jointure avec Client
      {
        $lookup: {
          from: "clients",
          localField: "voiture.client",
          foreignField: "_id",
          as: "client",
        },
      },
      { $unwind: "$client" },

      // Jointure avec User (pour nom et prénom)
      {
        $lookup: {
          from: "users",
          localField: "client.user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },

      // Jointure avec SousService pour récupérer le prix
      {
        $lookup: {
          from: "sousservices",
          localField: "sousService",
          foreignField: "_id",
          as: "sousService",
        },
      },
      { $unwind: "$sousService" },

      // Calcul du total par planning
      {
        $project: {
          userId: "$user._id",
          nom: "$user.nom",
          prenom: "$user.prenom",
          demandeId: "$demande._id",
          prixTotal: { $multiply: ["$qte", "$sousService.prix"] },
        },
      },

      // Regroupement par client + demande
      {
        $group: {
          _id: { userId: "$userId", demandeId: "$demandeId" },
          nom: { $first: "$nom" },
          prenom: { $first: "$prenom" },
          prixTotal: { $sum: "$prixTotal" },
        },
      },

      // Regroupement final par client
      {
        $group: {
          _id: "$_id.userId",
          nom: { $first: "$nom" },
          prenom: { $first: "$prenom" },
          nbDemandes: { $sum: 1 },
          prixTotal: { $sum: "$prixTotal" },
        },
      },

      // Tri pour avoir celui qui a rapporté le plus en haut
      { $sort: { prixTotal: -1 } },

      // On ne garde que le premier
      { $limit: 1 },
    ]);

    const meilleurMecanicien = await Planning.aggregate([
      {
        $match: {
          dateValidationTravail: { $ne: null }, // On ne considère que les plannings validés
        },
      },
      {
        $group: {
          _id: "$mecanicien",
          totalPlanning: { $sum: 1 },
          moyenneEtoiles: { $avg: "$nbEtoile" },
          tauxRespectEstimation: {
            $avg: {
              $cond: [
                { $eq: ["$tempsPasse", 0] },
                0,
                {
                  $multiply: [
                    { $divide: ["$estimationTotal", "$tempsPasse"] },
                    100,
                  ],
                },
              ],
            },
          },
        },
      },
      // Trier pour obtenir le meilleur taux de respect d'estimation
      { $sort: { tauxRespectEstimation: -1 } },
      { $limit: 1 },

      // Lookup vers Mecanicien pour obtenir l'utilisateur
      {
        $lookup: {
          from: "mecaniciens",
          localField: "_id",
          foreignField: "_id",
          as: "mecanicien",
        },
      },
      { $unwind: "$mecanicien" },

      // Lookup vers User pour avoir nom et prénom
      {
        $lookup: {
          from: "users",
          localField: "mecanicien.user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },

      {
        $project: {
          _id: 0,
          nom: "$user.nom",
          prenom: "$user.prenom",
          totalPlanning: 1,
          moyenneEtoiles: 1,
          tauxRespectEstimation: 1,
        },
      },
    ]);

    return res.status(200).json({
      bestFournisseur,
      statPiece,
      statService,
      bestClient,
      meilleurMecanicien,
      topClients,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur." });
  }
});

router.get("/statPieceService", async (req, res) => {
  try {
    const anneeCA = parseInt(req.query.anneeCA || new Date().getFullYear());
    console.log("anneeCA", req.query.anneeCA, anneeCA);

    if (isNaN(anneeCA)) {
      return res
        .status(400)
        .json({ message: "L'année doit être un nombre valide" });
    }

    var statPiece = await Mouvement.aggregate([
      {
        $match: {
          isEntree: false,
          dateMouvement: {
            $gte: new Date(anneeCA, 0, 1),
            $lt: new Date(anneeCA + 1, 0, 1),
          },
        },
      },
      {
        $project: {
          mois: { $month: "$dateMouvement" },
          calcul: { $multiply: ["$prix", "$nb"] },
        },
      },
      {
        $group: {
          _id: "$mois",
          total: { $sum: "$calcul" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    var statService = await Planning.aggregate([
      {
        $match: {
          dateHeureDebut: {
            $gte: new Date(anneeCA, 0, 1), // 1er janvier
            $lt: new Date(anneeCA + 1, 0, 1), // 1er janvier année suivante
          },
        },
      },
      {
        $lookup: {
          from: "sousservices", // nom de la collection
          localField: "sousService",
          foreignField: "_id",
          as: "sousService",
        },
      },
      { $unwind: "$sousService" },
      {
        $project: {
          mois: { $month: "$dateHeureDebut" }, // extrait le mois
          total: { $multiply: ["$qte", "$sousService.prix"] },
        },
      },
      {
        $group: {
          _id: "$mois", // grouper par mois
          total: { $sum: "$total" },
        },
      },
      { $sort: { _id: 1 } }, // trier par mois croissant
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

    // 4. Fusion des résultats avec le template
    statService = allMonths.map((month) => {
      const existingMonth = statService.find((item) => item._id === month._id);
      return existingMonth || month;
    });

    return res.status(200).json({
      statPiece,
      statService,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur." });
  }
});

router.get("/statTopClient", async (req, res) => {
  try {
    const anneeClient = parseInt(
      req.query.anneeClient || new Date().getFullYear()
    );
    if (isNaN(anneeClient)) {
      return res
        .status(400)
        .json({ message: "L'année doit être un nombre valide" });
    }

    const topClients = await Demande.aggregate([
      {
        $match: {
          dateValidation: {
            $ne: null,
            $gte: new Date(`${anneeClient}-01-01T00:00:00.000Z`),
            $lt: new Date(`${anneeClient + 1}-01-01T00:00:00.000Z`),
          },
        },
      },
      {
        $lookup: {
          from: "voitures",
          localField: "voiture",
          foreignField: "_id",
          as: "voiture",
        },
      },
      { $unwind: "$voiture" },
      {
        $lookup: {
          from: "clients",
          localField: "voiture.client",
          foreignField: "_id",
          as: "client",
        },
      },
      { $unwind: "$client" },
      {
        $lookup: {
          from: "users",
          localField: "client.user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $group: {
          _id: "$user._id",
          nom: { $first: "$user.nom" },
          prenom: { $first: "$user.prenom" },
          email: { $first: "$user.email" },
          nbDemandesValidees: { $sum: 1 },
        },
      },
      { $sort: { nbDemandesValidees: -1 } },
      { $limit: 5 },
    ]);

    return res.status(200).json({
      topClients,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur." });
  }
});

module.exports = router;
