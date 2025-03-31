const express = require("express");
const Voiture = require("../../models/Voiture");
const Service = require("../../models/Service");
const Demande = require("../../models/Demande");
const router = express.Router();

// Toutes les données pour le rendez-vous
router.get("/allData", async (req, res) => {
  try {
    const idClient = req.idClient;
    const listVoiture = await Voiture.find({ client: idClient });
    const allService = await Service.find().populate("sousServices");
    return res.status(200).json({ listVoiture, allService });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur." });
  }
});

// Création d'un rendez-vous
router.post("/newRDV", async (req, res) => {
  try {
    const idVoiture = req.body.idVoiture;
    const idService = req.body.idService;
    const details = req.body.details;
    console.log(details);
    
    const dates = req.body.dates;
    const demande = new Demande({
      voiture: idVoiture,
      details: {
        service: idService,
        details: details,
      },
      date: dates,
    });
    await demande.save();
    return res
      .status(201)
      .json({
        message:
          "Votre demande a bien été envoyée. Veuillez attendre la validation.",
      });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Erreur lors de l'insertion de la demande." });
  }
});

module.exports = router;
