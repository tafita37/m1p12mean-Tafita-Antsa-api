const express = require("express");
const router = express.Router();
const Marque = require("../../models/Marque");
const DetailPiece = require("../../models/DetailPiece");

// Insertion de marque
router.post("/insert", async (req, res) => {
  try {
    const nom = req.body.nom;
    const marques = new Marque({ nom: nom });
    await marques.save();
    return res.status(201).json({ message: "Marque insérée." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur lors de l'insertion de marque." });
  }
});

// Update de marque
router.post("/update", async (req, res) => {
  try {
    const idMarque = req.body.idMarque;
    const nom = req.body.nom;
    const marques = await Marque.findById(idMarque);
    marques.nom = nom;
    await marques.save();
    return res.status(201).json({ message: "Marque modifiée." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur lors de la modification de marque." });
  }
});

// Supprimer plusieurs marques
router.post("/delete", async (req, res) => {
  try {
    const idMarques = req.body.idMarques;
    if (!idMarques || !Array.isArray(idMarques)) {
      return res.status(400).json({ message: "Liste d'ID invalide." });
    }

    // Vérifier si une des marques est utilisée dans DetailPiece
    const count = await DetailPiece.countDocuments({
      marque: { $in: idMarques },
    });

    if (count > 0) {
      return res.status(400).json({
        message: "Impossible de supprimer ces marques.",
      });
    }

    await Marque.deleteMany({ _id: { $in: idMarques } });
    return res.status(200).json({ message: "Marque supprimées avec succès." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur lors de la suppression des marques." });
  }
});

// Liste des marques
router.get("/allMarque", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const size = 10;
    const skip = (page - 1) * size;
    const total = await Marque.countDocuments();
    const listMarque = await Marque.find()
      .skip(skip)
      .limit(size);
    return res.status(200).json({ marques: listMarque, nbMarque: total });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur." });
  }
});

module.exports = router;
