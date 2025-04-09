const mongoose = require("mongoose");

const DemandeSchema = new mongoose.Schema({
  voiture: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Voiture",
  },
  details: {
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    details: [
      {
        sousService: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SousService",
          required: true,
        },
        qte: { type: Number, required: true, min: 1 },
      },
    ],
  },
  date: [{ type: Date, required: true }],
  dateValidation: { type: Date, default: null },
  dateValidationTravail: { type: Date, default: null },
  dateRefus: { type: Date, default: null },
});

module.exports = mongoose.model("Demande", DemandeSchema);
