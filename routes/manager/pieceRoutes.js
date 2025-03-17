const express = require("express");
const router = express.Router();
const Piece = require("../../models/Piece");

// Insertion de piece
router.post("/insert", async (req, res) => {
  try {
    const nom = req.body.nom;
    const pieces = new Piece({ nom: nom });
    await pieces.save();
    res.status(201).json({ message: "Pièce insérée." });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'insertion de pièce." });
    console.error(error);
  }
});

// Update de pièces
router.post("/update", async (req, res) => {
  try {
    const idPiece = req.body.idPiece;
    const nom = req.body.nom;
    const pieces = await Piece.findById(idPiece);
    pieces.nom = nom;
    await pieces.save();
    res.status(201).json({ message: "Pièce modifiée." });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la modification de pièce." });
    console.error(error);
  }
});

// Supprimer plusieurs pièces
router.post("/delete", async (req, res) => {
  try {
    const idPieces = req.body.idPieces;
    if (!idPieces || !Array.isArray(idPieces)) {
      return res.status(400).json({ message: "Liste d'ID invalide." });
    }

    await Piece.deleteMany({ _id: { $in: idPieces } });
    res.status(200).json({ message: "Pièces supprimées avec succès." });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression des pièces." });
    console.error(error);
  }
});

// Liste des pièces
router.get("/allPiece", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const size = 20;
    const skip = (page - 1) * size;
    const total = await Piece.countDocuments();
    const listPiece = await Piece.find()
      .skip(skip)
      .limit(size);
    res
      .status(200)
      .json({ pieces: listPiece, nbPiece: total });
  } catch (error) {
    res.status(500).json({ message: "Erreur." });
    console.error(error);
  }
});

module.exports = router;
