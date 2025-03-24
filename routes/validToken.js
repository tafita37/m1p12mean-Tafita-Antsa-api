const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const SECRET_KEY_MANAGER = process.env.SECRET_KEY_MANAGER;

// Inscription mécanicien
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

module.exports = router;
