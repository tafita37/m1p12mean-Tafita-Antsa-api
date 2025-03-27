const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const router = express.Router();
const crypto = require("crypto");
const Role = require("../models/Role");
const User = require("../models/User");
const Manager = require("../models/Manager");
const TypeClient = require("../models/TypeClient");
const Client = require("../models/Client");
const Mecanicien = require("../models/Mecanicien");
const SECRET_KEY_CLIENT = process.env.SECRET_KEY_CLIENT;
const SECRET_KEY_MANAGER = process.env.SECRET_KEY_MANAGER;
const SECRET_KEY_MECANICIEN = process.env.SECRET_KEY_MECANICIEN;

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

// API d'insertion de type de clients multiples
router.post("/insertTypeClient", async (req, res) => {
  try {
    const typeClient = req.body;
    if (!Array.isArray(typeClient) || typeClient.length === 0) {
      return res.status(400).json({ message: "Aucun type client n'est fourni." });
    }
    const savedTypeClient = await TypeClient.insertMany(typeClient);
    return res.status(201).json(savedTypeClient);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Erreur lors de l'insertion des rôles." });
  }
});

// Inscription client
router.post("/registerUserClient", async (req, res) => {
  const { nom, prenom, email, mdp } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    const typeClient = await TypeClient.findOne({ reduction: 0 });
    if (existingUser)
      return res.status(400).json({ message: "L'utilisateur existe déjà." });
    const roles = await Role.findOne({ niveau: 1 });
    req.body.role = roles._id;
    const newUser = new User(req.body);
    await newUser.save();
    const client = new Client({ user: newUser._id, typeClient: typeClient._id });
    await client.save();
    res.status(201).json({ message: "Votre compte a été créer. Veuillez attendre la validation."});
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'inscription." });
    console.error(error);
  }
});

// Route de connexion client
router.post("/loginUserClient", async (req, res) => {
  const { email, mdp } = req.body;
  const users = await User.findOne({ email, dateSuppression : null }).populate("role");
  if (!users) return res.status(400).json({ message: "Utilisateur non trouvé" });
  if (users.role.niveau!=1) return res.status(400).json({ message: "Vous n'êtes pas client" });
  const isMatch = await bcrypt.compare(mdp, users.mdp);
  if (!isMatch)
    return res.status(400).json({ message: "Mot de passe incorrect" });
  if (users.dateValidation==null)
    return res.status(403).json({ message: "Votre inscription n'a pas encore été validé." });
  const token = jwt.sign(
    { id: users.id, email: users.email, type: "client" },
    SECRET_KEY_CLIENT,
    {
      expiresIn: "2h",
    }
  );

  res.json({ token });
});

// Route de connexion mecanicien
router.post("/loginUserMecanicien", async (req, res) => {
  const { email, mdp } = req.body;
  const users = await User.findOne({ email, dateSuppression: null }).populate(
    "role"
  );
  if (!users) return res.status(400).json({ message: "Utilisateur non trouvé" });
  if (users.role.niveau!=10) return res.status(400).json({ message: "Vous n'êtes pas mécanicien" });
  const isMatch = await bcrypt.compare(mdp, users.mdp);
  if (!isMatch)
    return res.status(400).json({ message: "Mot de passe incorrect" });
  if (users.dateValidation==null)
    return res.status(403).json({ message: "Votre inscription n'a pas encore été validé." });
  const token = jwt.sign(
    { id: users.id, email: users.email, type: "mecanicien" },
    SECRET_KEY_MECANICIEN,
    {
      expiresIn: "2h",
    }
  );

  res.json({ token });
});

// Route de connexion manager
router.post("/loginManager", async (req, res) => {
  const { email, mdp } = req.body;
  const manager = await Manager.findOne({ email });
  if (!manager) return res.status(400).json({ message: "Manageur non trouvé" });
  const isMatch = await bcrypt.compare(mdp, manager.mdp);
  if (!isMatch)
    return res.status(400).json({ message: "Mot de passe incorrect" });
  const token = jwt.sign({ id: manager.id, email: manager.email, type : "manager" }, SECRET_KEY_MANAGER, {
    expiresIn: "2h",
  });

  res.json({ token });
});

// Insertion de manager
router.post("/newManager", async (req, res) => {
  const { nom, prenom, email, mdp } = req.body;

  try {
    const existingManager = await Manager.findOne({ email });
    if (existingManager)
      return res.status(400).json({ message: "Il y a déjà un manager." });
    const newManager = new Manager(req.body);
    await newManager.save();
    res.status(201).json({ message: "Manager créé avec succès."});
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de l'inscription." });
    console.error(error);
  }
});

// Inscription mécanicien
router.post("/registerUserMecanicien", async (req, res) => {
  const { nom, prenom, email, mdp } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "L'utilisateur existe déjà." });
    const roles = await Role.findOne({ niveau: 10 });
    req.body.role = roles._id;
    const newUser = new User(req.body);
    await newUser.save();
    const mecanicien = new Mecanicien({
      user: newUser._id,
      dateEmbauche: req.body.dateEmbauche,
      dateRenvoie : null
    });
    await mecanicien.save();
    const employeType = await TypeClient.findOne({
      nom: { $regex: "^Employé$", $options: "i" },
    });
    const newClient = new Client({
      user: newUser._id,
      typeClient: employeType._id,
    });
    await newClient.save();
    res
      .status(201)
      .json({
        message: "Votre compte a été créer. Veuillez attendre la validation.",
      });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erreur lors de la création de mécanicien." });
    console.error(error);
  }
});

module.exports = router;
