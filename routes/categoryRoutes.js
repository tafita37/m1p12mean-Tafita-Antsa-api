const express = require("express");
const router = express.Router();
const Category = require("../models/Category");
router.post("/", async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const category = await Category.find();
    console.log("it worked");
    console.log(category);
    
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
module.exports = router; 