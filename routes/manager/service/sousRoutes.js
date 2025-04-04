const express = require("express");
const SousService = require("../../../models/SousService");
const Service = require("../../../models/Service");
const Piece = require("../../../models/Piece");
const router = express.Router();

// Nouveau sous services
router.post("/insert", async (req, res) => {
  try {
    const sousService = new SousService(req.body);
    if (req.body.pieces) {
      const pieces = req.body.pieces.map((piece) => {
        return { piece: piece.piece, etat: piece.etat };
      });
      var pieceFind = await Piece.find({
        _id: { $in: pieces.map((piece) => piece.piece) },
      });
      if (pieceFind.length !== pieces.length) {
        return res
          .status(400)
          .json({ message: "Il y a une pièce inexistante." });
      }
      for (var i = 0; i < pieceFind.length; i++) {
        if (pieceFind[i].type == 1 && pieces[i].etat != 1) {
          return res
            .status(400)
            .json({ message: "Cette pièce n'est pas réparable." });
        }
      }
      sousService.pieces = pieces;
    }
    await sousService.save();
    return res.status(201).json({ message: "Sous service insérée." });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Erreur lors de l'insertion de sous service." });
  }
});

// Liste des sous services
router.get("/allSousServices", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const size = 10;
    const skip = (page - 1) * size;
    const total = await SousService.countDocuments();
    const listSousServices = await SousService.find()
      .populate("pieces.piece")
      .skip(skip)
      .limit(size);
    const pieces = await Piece.find();
    return res
      .status(200)
      .json({ listSousServices, nbSousServices: total, pieces });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur." });
  }
});

// Update sous services
router.post("/update", async (req, res) => {
  try {
    const idSousService = req.body.idSousService;
    const sousService = await SousService.findById(idSousService);
    sousService.nom = req.body.nom;
    sousService.prix = req.body.prix;
    const pieces = req.body.pieces.map((piece) => {
      return { piece: piece.piece, etat: piece.etat };
    });
    console.log(req.body.pieces);

    var pieceFind = await Piece.find({
      _id: { $in: pieces.map((piece) => piece.piece) },
    });
    if (pieceFind.length !== pieces.length) {
      return res.status(400).json({ message: "Il y a une pièce inexistante." });
    }
    for (var i = 0; i < pieceFind.length; i++) {
      if (pieceFind[i].type == 1 && pieces[i].etat != 1) {
        return res
          .status(400)
          .json({ message: "Cette pièce n'est pas réoarable." });
      }
    }
    sousService.pieces.push(...pieces);
    await sousService.save();
    res.status(201).json({ message: "Sous service modifiée." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de l'update de sous service." });
    console.error(error);
  }
});

// Supprimer plusieurs sous services
router.post("/delete", async (req, res) => {
  try {
    const idSousServices = req.body.idSousServices;
    if (!idSousServices || !Array.isArray(idSousServices)) {
      return res.status(400).json({ message: "Liste d'ID invalide." });
    }
    const services = await Service.find({
      sousServices: { $in: idSousServices },
    });
    if (services.length > 0) {
      return res
        .status(400)
        .json({ message: "Vous ne pouvez pas supprimer ces sous services." });
    }
    await SousService.deleteMany({ _id: { $in: idSousServices } });
    return res
      .status(200)
      .json({ message: "Sous services supprimées avec succès." });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Erreur lors de la suppression des sous services." });
  }
});

// Supprimer une pièce d'un sous-service
router.post("/deletePieceFromSous", async (req, res) => {
  const idSousService = req.body.idSousService;
  const idPiece = req.body.idPiece;

  try {
    const sousService = await SousService.findById(idSousService);
    if (!sousService) {
      return res.status(404).json({ message: "Sous-service non trouvé" });
    }

    // Filtrer la pièce à supprimer
    sousService.pieces = sousService.pieces.filter(
      (p) => p.piece.toString() !== idPiece
    );

    // Sauvegarder les changements
    await sousService.save();

    return res
      .status(200)
      .json({ message: "Pièce supprimée avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de la pièce :", error);
    return res.status(500).json({ message: "Erreur serveur", error });
  }
});

module.exports = router;
