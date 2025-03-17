const express = require("express");
const router = express.Router();
const Marque = require("../../models/Marque");

// Insertion de marque
router.post("/insert", async (req, res) => {
  try {
    const nom = req.body.nom;
    const marques = new Marque({ nom: nom });
    await marques.save();
    res.status(201).json({ message: "Marque insérée." });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'insertion de marque." });
    console.error(error);
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
    res.status(201).json({ message: "Marque modifiée." });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la modification de marque." });
    console.error(error);
  }
});

// Supprimer plusieurs marques
router.post("/delete", async (req, res) => {
  try {
    const idMarques = req.body.idMarques;
    if (!idMarques || !Array.isArray(idMarques)) {
      return res.status(400).json({ message: "Liste d'ID invalide." });
    }

    await Marque.deleteMany({ _id: { $in: idMarques } });
    res.status(200).json({ message: "Marque supprimées avec succès." });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression des marques." });
    console.error(error);
  }
});

// Liste des marques
router.get("/allMarque", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const size = 20;
    const skip = (page - 1) * size;
    const total = await Marque.countDocuments();
    const listMarque = await Marque.find()
      .skip(skip)
      .limit(size);
    res.status(200).json({ pieces: listMarque, nbPiece: total });
  } catch (error) {
    res.status(500).json({ message: "Erreur." });
    console.error(error);
  }
});

module.exports = router;
