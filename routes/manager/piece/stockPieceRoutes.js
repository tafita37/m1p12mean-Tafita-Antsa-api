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
    const user = await User.findById(idUser).populate("role");
    if (user.dateValidation == null) {
      return res.status(500).json({
        message: "Veuillez d'abord valider l'inscription de cet utilisateur.",
      });
    }
    if (user.dateSuppression != null) {
      return res.status(500).json({
        message: "L'utilisateur a été supprimée.",
      });
    }
    const idFournisseur = req.body.idFournisseur;
    const prix = req.body.prix;
    var nb = req.body.nb;
    const isEntree = req.body.isEntree;
    const dateMouvement = req.body.dateMouvement;
    const nbMouvementAvant=await Mouvement.countDocuments({detailPiece : detailPiece._id, dateMouvement : {$gt : dateMouvement}});
    if(nbMouvementAvant!=0) {
      return res.status(500).json({
        message: "Vous ne pouvez plus faire de nouveau mouvement car un mouvement a déjà été effectué après.",
      });
    }
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
            dateMouvement: { $lte: mouvementInsert.dateMouvement },
            isEntree: true,
            detailPiece: detailPiece._id,
          },
        },
        {
          $addFields: {
            sortieFiltree: {
              $filter: {
                input: "$sortie",
                as: "s",
                cond: {
                  $lte: ["$$s.dateMouvement", mouvementInsert.dateMouvement],
                },
              },
            },
          },
        },
        {
          $addFields: {
            totalSortie: {
              $sum: "$sortieFiltree.nb",
            },
          },
        },
        {
          $match: {
            $expr: { $lt: ["$totalSortie", "$nb"] }, // Comparaison entre total des sorties et nb
          },
        },
        {
          $sort: { dateMouvement: -1 }, // Trie par dateMouvement décroissante
        },
      ]);
      const resteStock = await Mouvement.aggregate([
        {
          $match: {
            dateMouvement: { $lte: mouvementInsert.dateMouvement },
            isEntree: true,
            detailPiece: detailPiece._id,
          },
        },
        {
          $addFields: {
            sortieFiltree: {
              $filter: {
                input: "$sortie",
                as: "s",
                cond: {
                  $lte: ["$$s.dateMouvement", mouvementInsert.dateMouvement],
                },
              },
            },
          },
        },
        {
          $addFields: {
            totalSortie: {
              $sum: "$sortieFiltree.nb",
            },
          },
        },
        {
          $addFields: {
            disponible: {
              $subtract: ["$nb", "$totalSortie"],
            },
          },
        },
        {
          $match: {
            disponible: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: null,
            totalDisponible: { $sum: "$disponible" },
          },
        },
      ]);

      if (resteStock.length === 0 || resteStock[0].totalDisponible < nb) {
        return res.status(500).json({ message: "Stock insuffisant." });
      }

      await mouvementInsert.save();
      for (const mouvement of listMouvementEntree) {
        if (nb === 0) break;

        // Calculer la somme des sorties valides (avant la date du mouvement de sortie)
        const totalSortie = (mouvement.sortie || [])
          .filter(
            (s) =>
              new Date(s.dateMouvement) <=
              new Date(mouvementInsert.dateMouvement)
          )
          .reduce((acc, s) => acc + s.nb, 0);

        const disponible = mouvement.nb - totalSortie;

        if (disponible > 0) {
          const mouvementDetail = new MouvementDetail({
            mouvementEntree: mouvement._id,
            mouvementSortie: mouvementInsert._id,
          });

          let quantiteSortie = 0;

          if (nb <= disponible) {
            quantiteSortie = nb;
            nb = 0;
          } else {
            quantiteSortie = disponible;
            nb -= disponible;
          }

          mouvementDetail.nb = quantiteSortie;

          // Mise à jour du mouvement d'entrée : ajouter une sortie
          await Mouvement.findByIdAndUpdate(
            mouvement._id,
            {
              $push: {
                sortie: {
                  nb: quantiteSortie,
                  dateMouvement: mouvementInsert.dateMouvement,
                },
              },
            },
            { new: true }
          );

          await mouvementDetail.save();
        }
      }
    } else {
      if (user.role.niveau == 1) {
        return res.status(500).json({
          message: "Un client ne peut pas faire d'ajout de stock.",
        });
      }
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
    console.log(filterDate, "filtre", req.query.date);

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
        $addFields: {
          // Filtrage de la sortie pour ne garder que les entrées dont dateMouvement <= filterDate
          sortieFiltree: {
            $filter: {
              input: "$sortie",
              as: "s",
              cond: { $lte: ["$$s.dateMouvement", filterDate] },
            },
          },
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
                  $multiply: [
                    "$prix",
                    { $subtract: ["$nb", { $sum: "$sortieFiltree.nb" }] },
                  ],
                },
                else: 0,
              },
            },
          },
          totalResteAchat: {
            $sum: {
              $cond: {
                if: { $eq: ["$isEntree", true] },
                then: { $subtract: ["$nb", { $sum: "$sortieFiltree.nb" }] },
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
        $addFields: {
          // Filtrage de la sortie pour ne garder que les entrées dont dateMouvement <= filterDate
          sortieFiltree: {
            $filter: {
              input: "$sortie",
              as: "s",
              cond: { $lte: ["$$s.dateMouvement", filterDate] },
            },
          },
        },
      },
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
        $match: {
          dateValidation: { $ne: null }, // Filtrer uniquement les utilisateurs validés
        },
      },
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
    const detailPiece = await DetailPiece.findById(idDetailPiece)
      .populate("marque")
      .populate("piece");

    const dateFin =
      req.query.dateFin && req.query.dateFin != "null"
        ? new Date(req.query.dateFin)
        : null;
    const dateDebut =
      req.query.dateDebut && req.query.dateDebut != "null"
        ? new Date(req.query.dateDebut)
        : null;
    const typeMouvement = parseInt(req.query.typeMouvement) || 0;

    const page = parseInt(req.query.page) || 1;
    const size = 20;
    const skip = (page - 1) * size;

    // Définition des conditions de recherche
    const conditions = { detailPiece: idDetailPiece };

    if (dateDebut && !dateFin) {
      // Cas 1: Si dateDebut est défini, mais pas dateFin
      conditions["$expr"] = {
        $gte: [
          { $dateToString: { format: "%Y-%m-%d", date: "$dateMouvement" } },
          dateDebut.toISOString().split("T")[0],
        ],
      };
    } else if (!dateDebut && dateFin) {
      // Cas 2: Si dateFin est défini, mais pas dateDebut
      conditions["$expr"] = {
        $lte: [
          { $dateToString: { format: "%Y-%m-%d", date: "$dateMouvement" } },
          dateFin.toISOString().split("T")[0],
        ],
      };
    } else if (dateDebut && dateFin) {
      // Cas 3: Si dateDebut et dateFin sont définis
      conditions["$expr"] = {
        $and: [
          {
            $gte: [
              { $dateToString: { format: "%Y-%m-%d", date: "$dateMouvement" } },
              dateDebut.toISOString().split("T")[0],
            ],
          },
          {
            $lte: [
              { $dateToString: { format: "%Y-%m-%d", date: "$dateMouvement" } },
              dateFin.toISOString().split("T")[0],
            ],
          },
        ],
      };
    }

    if (typeMouvement === 1) {
      conditions["isEntree"] = true;
    } else if (typeMouvement === -1) {
      conditions["isEntree"] = false;
    }

    // Exécution de la recherche
    const listMouvements = await Mouvement.find(conditions)
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

    // Comptage des documents
    const total = await Mouvement.countDocuments(conditions);

    return res.status(200).json({
      detailPiece: detailPiece,
      mouvements: listMouvements,
      nbMouvements: total,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur." });
  }
});

module.exports = router;
