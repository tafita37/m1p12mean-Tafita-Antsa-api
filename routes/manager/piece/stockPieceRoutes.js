const express = require("express");
const router = express.Router();
const DetailPiece = require("../../../models/DetailPiece");
const Marque = require("../../../models/Marque");
const Piece = require("../../../models/Piece");
const Mouvement = require("../../../models/Mouvement");
const MouvementDetail = require("../../../models/MouvementDetail");
const User = require("../../../models/User");
const Fournisseur = require("../../../models/Fournisseur");

// Nouveau mouvement
router.post("/insert", async (req, res) => {
  try {
    const idPiece = req.body.idPiece;
    const idMarque = req.body.idMarque;
    var detailPiece = await DetailPiece.findOne({
      piece: idPiece,
      marque: idMarque,
    });
    if (!detailPiece) {
      detailPiece = await DetailPiece.create({
        piece: idPiece,
        marque: idMarque,
      });
    }
    const idUser = req.body.idUser;
    const user = await User.findById(idUser);
    if (user.dateValidation == null) {
      return res.status(500).json({
        message: "Veuillez d'abord valider l'inscription de cet utilisateur.",
      });
    }
    if (user.dateSuppression == null) {
      return res.status(500).json({
        message: "L'utilisateur a été supprimée.",
      });
    }
    const idFournisseur = req.body.idFournisseur;
    const prix = req.body.prix;
    var nb = req.body.nb;
    const isEntree = req.body.isEntree;
    const dateMouvement = req.body.dateMouvement;
    const mouvementInsert = new Mouvement({
      detailPiece: detailPiece._id,
      utilisateur: idUser,
      fournisseur: idFournisseur,
      prix: prix,
      isEntree: isEntree,
      nb: nb,
    });
    if (dateMouvement) {
      mouvementInsert.dateMouvement = new Date(dateMouvement);
    }
    if (!isEntree) {
      const listMouvementEntree = await Mouvement.aggregate([
        {
          $match: {
            isEntree: true,
            detailPiece: detailPiece._id,
            $expr: { $lt: ["$sortie", "$nb"] },
          },
        },
        {
          $sort: { dateMouvement: -1 }, // Trie directement en base de données par dateMouvement décroissant
        },
      ]);
      const resteStock = await Mouvement.aggregate([
        {
          $match: {
            isEntree: true,
            detailPiece: detailPiece._id,
            $expr: { $lt: ["$sortie", "$nb"] }, // Filtre les entrées où sortie < nb
          },
        },
        {
          $group: {
            _id: null, // Pas besoin de regrouper par un champ spécifique
            totalDisponible: { $sum: { $subtract: ["$nb", "$sortie"] } }, // Calcule nb - sortie et fait la somme
          },
        },
      ]);
      if (resteStock.length == 0 || resteStock[0].totalDisponible < nb) {
        return res.status(500).json({ message: "Stock insuffisant." });
      }
      await mouvementInsert.save();
      for (const mouvement of listMouvementEntree) {
        if (nb == 0) break;

        if (mouvement.nb - mouvement.sortie != 0) {
          var reste = mouvement.nb - mouvement.sortie;
          var mouvementDetail = new MouvementDetail({
            mouvementEntree: mouvement._id,
            mouvementSortie: mouvementInsert._id,
          });
          if (nb <= reste) {
            mouvementDetail.nb = nb;
            mouvement.sortie += nb;
            nb = 0;
          } else {
            mouvement.sortie = mouvement.nb;
            nb -= reste;
            mouvementDetail.nb = reste;
          }
          move = await Mouvement.findById(mouvement._id);
          move.detailPiece = mouvement.detailPiece;
          move.utilisateur = mouvement.utilisateur;
          move.fournisseur = mouvement.fournisseur;
          move.prix = mouvement.prix;
          move.nb = mouvement.nb;
          move.sortie = mouvement.sortie;
          move.isEntree = mouvement.isEntree;
          await move.save();
          mouvementDetail.save();
        }
      }
    } else {
      await mouvementInsert.save();
    }
    return res.status(201).json({ message: "Mouvement créer." });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Erreur lors de l'insertion de pièce." });
  }
});

// Stock de pièces
router.get("/allDataStock", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const size = 10;
    const skip = (page - 1) * size;
    const filterDate = new Date(req.query.date);

    const result = await Mouvement.aggregate([
      {
        $addFields: {
          normalizedDate: {
            $dateFromParts: {
              year: { $year: "$dateMouvement" },
              month: { $month: "$dateMouvement" },
              day: { $dayOfMonth: "$dateMouvement" },
            },
          },
        },
      },
      {
        $match: {
          normalizedDate: { $lte: filterDate },
        },
      },
      {
        $lookup: {
          from: "detailpieces",
          localField: "detailPiece",
          foreignField: "_id",
          as: "detailPiece",
        },
      },
      { $unwind: "$detailPiece" },
      {
        $lookup: {
          from: "pieces",
          localField: "detailPiece.piece",
          foreignField: "_id",
          as: "piece",
        },
      },
      { $unwind: { path: "$piece", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "marques",
          localField: "detailPiece.marque",
          foreignField: "_id",
          as: "marque",
        },
      },
      { $unwind: { path: "$marque", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          "detailPiece.piece": "$piece", // Ajoutez piece à detailPiece
          "detailPiece.marque": "$marque", // Ajoutez marque à detailPiece
        },
      },
      {
        $group: {
          _id: "$detailPiece._id",
          detailPiece: { $first: "$detailPiece" },
          totalVente: {
            $sum: {
              $cond: {
                if: { $eq: ["$isEntree", false] },
                then: "$nb",
                else: 0,
              },
            },
          },
          coutAchat: {
            $sum: {
              $cond: {
                if: { $eq: ["$isEntree", true] },
                then: {
                  $multiply: ["$prix", { $subtract: ["$nb", "$sortie"] }],
                },
                else: 0,
              },
            },
          },
          totalResteAchat: {
            $sum: {
              $cond: {
                if: { $eq: ["$isEntree", true] },
                then: { $subtract: ["$nb", "$sortie"] },
                else: 0,
              },
            },
          },
        },
      },
      {
        $addFields: {
          coutAchat: {
            $cond: {
              if: { $eq: ["$totalResteAchat", 0] },
              then: 0,
              else: { $divide: ["$coutAchat", "$totalResteAchat"] },
            },
          },
        },
      },
      { $sort: { totalVente: -1 } },
      { $skip: skip },
      { $limit: size },
    ]);

    const totalCountPipeline = await Mouvement.aggregate([
      {
        $addFields: {
          normalizedDate: {
            $dateFromParts: {
              year: { $year: "$dateMouvement" },
              month: { $month: "$dateMouvement" },
              day: { $dayOfMonth: "$dateMouvement" },
            },
          },
        },
      },
      {
        $match: {
          normalizedDate: { $lte: filterDate },
        },
      },
      {
        $lookup: {
          from: "detailpieces",
          localField: "detailPiece",
          foreignField: "_id",
          as: "detailPiece",
        },
      },
      { $unwind: "$detailPiece" },
      {
        $lookup: {
          from: "pieces",
          localField: "detailPiece.piece",
          foreignField: "_id",
          as: "piece",
        },
      },
      { $unwind: { path: "$piece", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "marques",
          localField: "detailPiece.marque",
          foreignField: "_id",
          as: "marque",
        },
      },
      { $unwind: { path: "$marque", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$detailPiece._id",
        },
      },
      { $count: "total" },
    ]);

    const total =
      totalCountPipeline.length > 0 ? totalCountPipeline[0].total : 0;
    const allPiece = await Piece.find();
    const allMarque = await Marque.find();
    // const allUser = await User.find().select("-mdp");
    const allUser = await User.aggregate([
      {
        $lookup: {
          from: "roles", // Nom de la collection MongoDB des rôles
          localField: "role",
          foreignField: "_id",
          as: "roleData",
        },
      },
      {
        $unwind: { path: "$roleData", preserveNullAndEmptyArrays: true }, // Déstructure roleData en objet
      },
      {
        $project: {
          _id: 1,
          nom: 1,
          prenom: 1,
          email: 1,
          fullName: {
            $concat: ["$nom", " ", "$prenom", " (", "$roleData.nom", ")"],
          }, // Concaténation du nom et prénom
          role: "$roleData", // Remplace l'ID du rôle par l'objet complet
        },
      },
    ]);

    const allFournisseur = await Fournisseur.find();
    res.status(200).json({
      stock: result,
      nbStock: total,
      pieces: allPiece,
      marques: allMarque,
      users: allUser,
      fournisseurs: allFournisseur,
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur." });
    console.error(error);
  }
});

// Liste des mouvements d'une détail pièce
router.get("/listeMouvement", async (req, res) => {
  try {
    const idDetailPiece = req.query.idDetailPiece;
    const dateMouvement = req.query.dateMouvement
      ? new Date(req.query.dateMouvement)
      : new Date();
    const page = parseInt(req.query.page) || 1;
    const size = 10;
    const skip = (page - 1) * size;
    const listMouvements = await Mouvement.find({
      detailPiece: idDetailPiece,
      $expr: {
        $lte: [
          { $dateToString: { format: "%Y-%m-%d", date: "$dateMouvement" } }, // Convertit la date stockée en YYYY-MM-DD
          dateMouvement.toISOString().split("T")[0], // Transforme la date donnée en chaîne "YYYY-MM-DD"
        ],
      },
    })
      .populate({
        path: "detailPiece",
        populate: [{ path: "marque" }, { path: "piece" }],
      })
      .populate("fournisseur")
      .populate({
        path: "utilisateur",
        populate: {
          path: "role",
        },
        select: "-mdp",
      })
      .sort({ dateMouvement: -1 })
      .skip(skip)
      .limit(size);
    const total = await Mouvement.countDocuments({
      detailPiece: idDetailPiece,
      $expr: {
        $lte: [
          { $dateToString: { format: "%Y-%m-%d", date: "$dateMouvement" } }, // Convertit la date stockée en YYYY-MM-DD
          dateMouvement.toISOString().split("T")[0], // Transforme la date donnée en chaîne "YYYY-MM-DD"
        ],
      },
    });
    res.status(200).json({ mouvements: listMouvements, nbMouvements: total });
  } catch (error) {
    res.status(500).json({ message: "Erreur." });
    console.error(error);
  }
});

module.exports = router;
