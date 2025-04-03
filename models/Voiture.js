const mongoose = require("mongoose");

const VoitureSchema = new mongoose.Schema(
  {
    marque: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Marque",
      required: true,
    },
    anneeFabrication: { type: Number, required: true },
    matricule: { type: String, unique: true, required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
    dateSuppression: {
      type: Date,
      default: null, // Champ nullable par défaut
    },
  },
  { timestamps: true }
);

const Voiture = mongoose.model("Voiture", VoitureSchema);

module.exports = Voiture;
