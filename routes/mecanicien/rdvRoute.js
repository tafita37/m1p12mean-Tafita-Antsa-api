const express = require("express");
const Planning = require("../../models/Planning");
const router = express.Router();

// Récupérer les tâches à faire du mécanicien par ordre croissant
router.get("/getPlanning", async (req, res) => {
  try {
    const idMecanicien = req.idMecanicien;
    const page = parseInt(req.query.page) || 1;
    const size = 10;
    const skip = (page - 1) * size;
    const total = await Planning.countDocuments({
      mecanicien: idMecanicien,
      dateValidationTravail : null,
      // resteAFaire: { $ne: 0 },
    });
    const listPlanning = await Planning.find({
      mecanicien: idMecanicien,
      dateValidationTravail : null,
      // resteAFaire: { $ne: 0 },
    })
      .sort({ dateHeureDebut: 1 })
      .skip(skip)
      .limit(size)
      .populate("sousService");
    return res.status(200).json({ listPlanning, nbPlanning : total });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur." });
  }
});

// Insertion de piece
router.post("/updatePlanning", async (req, res) => {
  try {
    const idPlanning = req.body.idPlanning;
    const planning = await Planning.findById(idPlanning);
    planning.tempsPasse = req.body.tempsPasse;
    planning.resteAFaire = req.body.resteAFaire;
    await planning.save();
    return res.status(201).json({ message: "Planning mis à jour." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur lors de la mise à jour du planning." });
  }
});


module.exports = router;
