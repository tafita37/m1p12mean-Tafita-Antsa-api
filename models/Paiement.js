const mongoose = require("mongoose");

const PaiementSchema = new mongoose.Schema({
  montant: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Paiement", PaiementSchema);
