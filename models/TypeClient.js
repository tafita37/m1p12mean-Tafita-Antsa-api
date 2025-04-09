const mongoose = require("mongoose");

const TypeClientSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, "Le nom est requis."],
      trim: true,
      unique: true,
    },
    nbRdvMin: {
      type: Number,
      required: [true, "Le nombre de rendez-vous minimum est requis."],
      min: [0, "Le nombre de rendez-vous minimum doit être au minimum de 0."],
      max: [50, "Le nombre de rendez-vous minimum ne peut pas dépasser 50."],
    },
    reduction: {
      type: Number,
      required: [true, "Le pourcentage de réduction est requis."],
      min: [0, "La réduction doit être au minimum de 0%."],
      max: [100, "La réduction ne peut pas dépasser 100%."],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TypeClient", TypeClientSchema);
