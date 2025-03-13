const express = require("express");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const SECRET_KEY_MANAGER = process.env.SECRET_KEY_MANAGER;

// Middleware de vérification de manager
const verifyManager = function (req, res, next) {
  console.log(SECRET_KEY_MANAGER, "secret");
  
  const token = req.header("Authorization").replace("Bearer ", "");
  console.log(token);
  
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

module.exports = verifyManager;