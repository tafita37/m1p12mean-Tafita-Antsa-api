const mongoose = require("mongoose");

const FactureSchema = new mongoose.Schema({
  demande: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Demande",
  },
  dateFacture: { type: Date, default: Date.now },
  factureDetail: [
    { type: mongoose.Schema.Types.ObjectId, ref: "FactureDetail" },
  ],
    paiement: [{ type: mongoose.Schema.Types.ObjectId, ref: "Paiement" }],
  montantTotal: { type: Number, default : 0 },
  montantPaye: { type: Number, default : 0 },
});

module.exports = mongoose.model("Facture", FactureSchema);