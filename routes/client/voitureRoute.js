const express = require("express");
const Voiture = require("../../models/Voiture");
const Marque = require("../../models/Marque");
const router = express.Router();

// Insertion de voitures
router.post("/insert", async (req, res) => {
  try {
    const marque = req.body.marque;
    const matricule = req.body.matricule;
    const anneeFabrication = req.body.anneeFabrication;
    const client = req.idClient;
    const voiture = new Voiture({
      marque: marque,
      matricule: matricule,
      anneeFabrication: anneeFabrication,
      client: client,
    });
    await voiture.save();
    res.status(201).json({ message: "Voiture insérée." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de l'insertion de la voiture." });
    console.error(error);
  }
});

// Liste des voitures paginées
router.get("/allVoiture", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const size = 10;
    const skip = (page - 1) * size;
    const client = req.idClient;
    const total = await Voiture.countDocuments({
      client: client,
      dateSuppression: null,
    });
    const listVoiture = await Voiture.find({
      client: client,
      dateSuppression: null,
    }).populate("marque")
      .skip(skip)
          .limit(size);
      const allMarques=await Marque.find({});
    res
      .status(200)
      .json({ voitures: listVoiture, nbVoiture: total, allMarques });
  } catch (error) {
    res.status(500).json({ message: "Erreur." });
    console.error(error);
  }
});

// Update de voitures
router.post("/update", async (req, res) => {
  try {
    const idVoiture = req.body.idVoiture;
    const marque = req.body.marque;
    const matricule = req.body.matricule;
    const anneeFabrication = req.body.anneeFabrication;
    const client = req.idClient;
    const voiture = await Voiture.findOne({
      _id: idVoiture,
      client: client,
      dateSuppression: null,
    });
    voiture.marque = marque;
    voiture.matricule = matricule;
    voiture.anneeFabrication = anneeFabrication;
    await voiture.save();
    res.status(201).json({ message: "Voiture modifiée." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la modification de la voiture." });
    console.error(error);
  }
});

// Supprimer plusieurs voitures
router.post("/delete", async (req, res) => {
  try {
    const idVoitures = req.body.idVoitures;
    if (!idVoitures || !Array.isArray(idVoitures)) {
      return res.status(400).json({ message: "Liste d'ID invalide." });
    }
    await Voiture.updateMany(
      { _id: { $in: idVoitures } },
      { dateSuppression: new Date() }
    );
    res.status(200).json({ message: "Voitures supprimées avec succès." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la suppression des voitures." });
    console.error(error);
  }
});

module.exports = router;
