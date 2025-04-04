const mongoose = require("mongoose");

const FactureDetailSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantite: { type: Number, required: true },
  prixUnitaire: { type: Number, required: true },
});

module.exports = mongoose.model("FactureDetail", FactureDetailSchema);
