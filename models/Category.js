const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema(
  {
    nom: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", CategorySchema);