const express = require("express");
const router = express.Router();
const Piece = require("../../models/Piece");
const DetailPiece = require("../../models/DetailPiece");

// Insertion de piece
router.post("/insert", async (req, res) => {
  try {
    const nom = req.body.nom;
    const type = req.body.type;
    const prixReparation = req.body.prixReparation;
    const prixRemplacement = req.body.prixRemplacement;
    if (type == 11 && (prixReparation == null || prixReparation == 0)) {
      return res.status(400).json({ message: "Prix de réparation requis." });
    }
    const pieces = new Piece(
      { nom: nom, type: type, prixReparation: prixReparation, prixRemplacement: prixRemplacement }
    );
    await pieces.save();
    return res.status(201).json({ message: "Pièce insérée." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur lors de l'insertion de pièce." });
  }
});

// Update de pièces
router.post("/update", async (req, res) => {
  try {
    const idPiece = req.body.idPiece;
    const nom = req.body.nom;
    const type = req.body.type;
    const prixReparation = req.body.prixReparation;
    const prixRemplacement = req.body.prixRemplacement;
    if (type == 11 && (prixReparation == null || prixReparation == 0)) {
      return res.status(400).json({ message: "Prix de réparation requis." });
    }
    const pieces = await Piece.findById(idPiece);
    pieces.nom = nom;
    pieces.type = type;
    pieces.prixReparation = prixReparation;
    pieces.prixRemplacement = prixRemplacement;
    await pieces.save();
    return res.status(201).json({ message: "Pièce modifiée." });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Erreur lors de la modification de pièce." });
  }
});

// Supprimer plusieurs pièces
router.post("/delete", async (req, res) => {
  try {
    const idPieces = req.body.idPieces;
    if (!idPieces || !Array.isArray(idPieces)) {
      return res.status(400).json({ message: "Liste d'ID invalide." });
    }

    // Vérifier si une des marques est utilisée dans DetailPiece
    const count = await DetailPiece.countDocuments({
      piece: { $in: idPieces },
    });

    if (count > 0) {
      return res.status(400).json({
        message: "Impossible de supprimer ces pièces.",
      });
    }

    await Piece.deleteMany({ _id: { $in: idPieces } });
    res.status(200).json({ message: "Pièces supprimées avec succès." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la suppression des pièces." });
    console.error(error);
  }
});

// Liste des pièces
router.get("/allPiece", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const size = 10;
    const skip = (page - 1) * size;
    const total = await Piece.countDocuments();
    const listPiece = await Piece.find().skip(skip).limit(size);
    res.status(200).json({ pieces: listPiece, nbPiece: total });
  } catch (error) {
    res.status(500).json({ message: "Erreur." });
    console.error(error);
  }
});

router.use("/details", require("./piece/pieceDetailRoutes"));
router.use("/stock", require("./piece/stockPieceRoutes"));

module.exports = router;
