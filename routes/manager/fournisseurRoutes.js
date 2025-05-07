const express = require("express");
const router = express.Router();
const Fournisseur = require("../../models/Fournisseur");

// Inscription fournisseur
router.post("/insert", async (req, res) => {
  try {
    const fournisseur = new Fournisseur(req.body);
    await fournisseur.save();
    return res.status(201).json({ message: "Fournisseur inséré." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur lors de l'insertion de fournisseur." });
  }
});

// Update de fournisseur
router.post("/update", async (req, res) => {
  try {
    const idFournisseur = req.body.idFournisseur;
    const nom = req.body.nom;
    const contact = req.body.contact;
    const email = req.body.email;
    const fournisseur = await Fournisseur.findById(idFournisseur);
    fournisseur.nom = nom;
    fournisseur.contact = contact;
    fournisseur.email = email;
    await fournisseur.save();
    return res.status(201).json({ message: "Fournisseur modifié." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur lors de la modification de fournisseur." });
  }
});

// Supprimer plusieurs fournisseurs
router.post("/delete", async (req, res) => {
  try {
    const idFournisseurs = req.body.idFournisseurs;
    if (!Array.isArray(idFournisseurs) || idFournisseurs.length === 0) {
      return res.status(400).json({ message: "Aucun fournisseur fourni." });
    }
    await Fournisseur.deleteMany({ _id: { $in: idFournisseurs } });
    return res.status(201).json({ message: "Fournisseur(s) supprimé(s)." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur lors de la suppression de fournisseur." });
  }
});

// Liste des fournisseurs
router.get("/allFournisseur", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const size = 10;
    const skip = (page - 1) * size;
    const total = await Fournisseur.countDocuments();
    const listFournisseur = await Fournisseur.find()
      .skip(skip)
      .limit(size);
    return res.status(200).json({ fournisseur: listFournisseur, nbFournisseur: total });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur." });
  }
});

module.exports = router;
