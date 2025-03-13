const express = require("express");
const router = express.Router();
const User = require("../models/User");

// Inscription mécanicien
router.get("/allUserNotValider", async (req, res) => {
  try {
    const existingUser = await User.find({ dateValidation : null });
    res.status(201).json({user : existingUser});
  } catch (error) {
    res.status(500).json({ message: "Erreur." });
    console.error(error);
  }
});


module.exports = router;