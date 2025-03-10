const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const router = express.Router();
const crypto = require("crypto");
const SECRET_KEY = crypto.randomBytes(64).toString("hex");
const Role = require("../models/Role");
const User = require("../models/User");

// API d'insertion de rôles multiples
router.post("/insertMultipleRole", async (req, res) => {
  try {
    const roles = req.body.roles;
    if (!Array.isArray(roles) || roles.length === 0) {
      return res.status(400).json({ message: "Aucun rôle fourni." });
    }
    const savedRoles = await Role.insertMany(roles);
    return res.status(201).json(savedRoles);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Erreur lors de l'insertion des rôles.", error });
  }
});

// Inscription
router.post("/registerUser", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "L'utilisateur existe déjà." });

    const newUser = new User(req.body);
    await newUser.save();
    console.log("secret " + SECRET_KEY);

    const token = jwt.sign(
      { id: newUser._id, username: newUser.email, type: "user" },
      SECRET_KEY,
      {
        expiresIn: "2h",
      }
    );
    res.status(201).json({ message: "Utilisateur créé avec succès.", token});
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'inscription." });
    console.error(error);
  }
});

// Route de connexion
router.post("/loginUser", async (req, res) => {
  const { email, mdp } = req.body;
  const users = await User.findOne({ email });
  if (!users) return res.status(400).json({ message: "Utilisateur non trouvé" });
  const isMatch = await bcrypt.compare(mdp, users.mdp);
  if (!isMatch)
    return res.status(400).json({ message: "Mot de passe incorrect" });
  const token = jwt.sign({ id: users.id, email: users.email }, SECRET_KEY, {
    expiresIn: "2h",
  });

  res.json({ token });
});

// // Route protégée
// router.get("/protected", verifyToken, (req, res) => {
//   res.json({ message: "Accès autorisé", user: req.user });
// });

module.exports = router;
