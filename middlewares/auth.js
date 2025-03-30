const express = require("express");
const jwt = require("jsonwebtoken");
const Client = require("../models/Client");
require("dotenv").config();
const SECRET_KEY_MANAGER = process.env.SECRET_KEY_MANAGER;
const SECRET_KEY_CLIENT = process.env.SECRET_KEY_CLIENT;

// Middleware de vérification de manager
const verifyManager = function (req, res, next) {
  var token = req.header("Authorization") ;
  token = token ? token.replace("Bearer ", "") : "";
  if (!token)
    return res.status(401).json({ message: "Accès refusé, token manquant" });
  try {
    const decoded = jwt.verify(
      token.replace("Bearer ", ""),
      SECRET_KEY_MANAGER
    );
    if (decoded.type !== "manager") {
      return res
        .status(403)
        .json({ message: "Accès interdit, vous n'êtes pas manager" });
    }
    next();
  } catch (err) {
    res.status(400).json({ message: "Token invalide ou expiré" });
    console.error(err);
  }
};

// Middleware de vérification de client
const verifyClient = async function (req, res, next) {
  var token = req.header("Authorization");
  token = token ? token.replace("Bearer ", "") : "";
  if (!token)
    return res.status(401).json({ message: "Accès refusé, token manquant" });

  try {
    const decoded = jwt.verify(token, SECRET_KEY_CLIENT);

    // Attendre la recherche du client dans la base de données
    const client = await Client.findOne({ user: decoded.id });

    if (!client) {
      return res.status(404).json({ message: "Client non trouvé" });
    }

    req.idUser = decoded.id;
    req.idClient = client._id;

    if (decoded.type !== "client") {
      return res
        .status(403)
        .json({ message: "Accès interdit, vous n'êtes pas client" });
    }

    next();
  } catch (err) {
    res.status(400).json({ message: "Token invalide ou expiré" });
    console.error(err);
  }
};


module.exports = {verifyManager, verifyClient};