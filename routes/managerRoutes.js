const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const crypto = require("crypto");
const SECRET_KEY = crypto.randomBytes(64).toString("hex");
const Role = require("../models/Role");
const User = require("../models/User");

// Inscription mécanicien
router.post("/insertMecanicien", async (req, res) => {
  const { nom, prenom, email, mdp } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "L'utilisateur existe déjà." });
    const roles = await Role.findOne({ niveau: 10 });
    req.body.role = roles._id;
    const newUser = new User(req.body);
    await newUser.save();
    console.log("secret " + SECRET_KEY);
    res.status(201).json({ message: "Mécanicien créé avec succès."});
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la création de mécanicien." });
    console.error(error);
  }
});