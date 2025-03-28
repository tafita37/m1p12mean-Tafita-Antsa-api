const express = require("express");
const SousService = require("../../models/SousService");
const Service = require("../../models/Service");
const router = express.Router();

// Nouveau sous services
router.post("/insertSousService", async (req, res) => {
  try {
    const sousService = new SousService(req.body);
    await sousService.save();
    res.status(201).json({ message: "Sous service insérée." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de l'insertion de sous service." });
    console.error(error);
  }
});

// Liste des sous services
router.get("/allSousServices", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const size = 20;
    const skip = (page - 1) * size;
    const total = await SousService.countDocuments({});
    const listSousServices = await SousService.find({}).skip(skip).limit(size);
    return res.status(200).json({ listSousServices, nbSousServices: total });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur." });
  }
});

// Update sous services
router.post("/updateSousService", async (req, res) => {
  try {
    const idSousService = req.body.idSousService;
    const sousService = await SousService.findById(idSousService);
    sousService.nom = req.body.nom;
    sousService.prix = req.body.prix;
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
router.post("/deleteSousService", async (req, res) => {
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

module.exports = router;
