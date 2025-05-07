const express = require("express");
const SousService = require("../models/SousService");
const router = express.Router();

router.get("/allData", async (req, res) => {
  try {
    const count = await SousService.countDocuments();
    console.log("Nombre total de sous-services:", count);
    const randomSkip = Math.max(0, Math.floor(Math.random() * (count - 9)));
    const sousServices = await SousService.find().skip(randomSkip).limit(9);
    res.json({ sousServices, aa:"ff" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 