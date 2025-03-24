const express = require("express");
const router = express.Router();
const DetailPiece = require("../../../models/DetailPiece");
const Marque = require("../../../models/Marque");
const Piece = require("../../../models/Piece");

// Insertion de détails de pieces
router.post("/insert", async (req, res) => {
  try {
    const idPiece = req.body.idPiece;
    const idMarque = req.body.idMarque;
    const pieceDetail = new DetailPiece(
        { piece: idPiece, marque: idMarque }
    );
    await pieceDetail.save();
    return res.status(201).json({ message: "Détails de pièce inséré." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur lors de l'insertion de pièce." });
  }
});

// Update de détails de pièces
router.post("/update", async (req, res) => {
  try {
    const idDetailPiece = req.body.idDetailPiece;
    const pieceDetail = await DetailPiece.findById(idDetailPiece);  
    await pieceDetail.save();
    return res.status(201).json({ message: "Détails de pièce modifié." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur lors de la modification." });
  }
});

// Supprimer plusieurs détails pièces
router.post("/delete", async (req, res) => {
  try {
    const idDetailPieces = req.body.idDetailPieces;
    if (!idDetailPieces || !Array.isArray(idDetailPieces)) {
      return res.status(400).json({ message: "Liste d'ID invalide." });
    }

    await DetailPiece.deleteMany({ _id: { $in: idDetailPieces } });
    return res.status(200).json({ message: "Détails de pièces supprimées avec succès." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur lors de la suppression des pièces." });
  }
});

// Liste des détails pièces
router.get("/allDetailPiece", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const size = 20;
    const skip = (page - 1) * size;
    const total = await DetailPiece.countDocuments();
    const marques = await Marque.find();
    const pieces = await Piece.find();
    const listDetailPiece = await DetailPiece.find().populate("piece").populate("marque")
      .skip(skip)
      .limit(size);
    return res.status(200).json({ detailPieces: listDetailPiece, nbDetailsPiece: total, marques : marques, pieces : pieces });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur." });
  }
});

module.exports = router;
