const mongoose = require("mongoose");

const FournisseurSchema = new mongoose.Schema({
  nom: { type: String, required: true, unique: true },
  contact: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
});
module.exports = mongoose.model("Fournisseur", FournisseurSchema);