const mongoose = require("mongoose");
const Counter = require("./Counter"); 

const FactureSchema = new mongoose.Schema({
  numeroFacture: { type: Number, unique: true },
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

FactureSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { name: "facture" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.numeroFacture = counter.seq;
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

module.exports = mongoose.model("Facture", FactureSchema);