const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const SECRET_KEY_MANAGER = process.env.SECRET_KEY_MANAGER;
const SECRET_KEY_CLIENT = process.env.SECRET_KEY_CLIENT;
const SECRET_KEY_MECANICIEN = process.env.SECRET_KEY_MECANICIEN;

// Vérifier si le token manager est valide
router.get("/isTokenManagerValid", async (req, res) => {
  try {
    var token = req.header("Authorization");
    var token = req.header("Authorization");
    token = token ? token.replace("Bearer ", "") : "";
    const decoded = jwt.verify(token, SECRET_KEY_MANAGER);
    if (decoded.type !== "manager") {
      return res
        .status(403)
        .json({ message: "Accès interdit, vous n'êtes pas manager" });
    }
    return res.status(200).json({ valid: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ valid: false });
  }
});

// Vérifier si le token client est valide
router.get("/isTokenClientValid", async (req, res) => {
    try {
        var token = req.header("Authorization");
        var token = req.header("Authorization");
        token = token ? token.replace("Bearer ", "") : "";
      const decoded = jwt.verify(token, SECRET_KEY_CLIENT);
      if (decoded.type !== "client") {
        return res
          .status(403)
          .json({ message: "Accès interdit, vous n'êtes pas client" });
      }
      res.status(200).json({ valid : true });
    } catch (error) {
        res.status(500).json({ valid : false });
        console.error(error);
    }
});

// Vérifier si le token mecanicien est valide
router.get("/isTokenMecanicienValid", async (req, res) => {
    try {
        var token = req.header("Authorization");
        var token = req.header("Authorization");
        token = token ? token.replace("Bearer ", "") : "";
      const decoded = jwt.verify(token, SECRET_KEY_MECANICIEN);
      if (decoded.type !== "mecanicien") {
        return res
          .status(403)
          .json({ message: "Accès interdit, vous n'êtes pas mécanicien" });
      }
      res.status(200).json({ valid : true });
    } catch (error) {
        res.status(500).json({ valid : false });
        console.error(error);
    }
});



module.exports = router;