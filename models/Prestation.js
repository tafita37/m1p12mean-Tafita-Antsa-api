const mongoose = require("mongoose");

const PrestationSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, "Le nom de la prestation est obligatoire."]
    },
    detailPieces: [{  // Notez le changement de nom pour refléter qu'on référence directement
      type: mongoose.Schema.Types.ObjectId,
      ref: "DetailPiece",
      required: [true, "Au moins un détail de pièce est requis."]
    }],
    duree: {
      type: Number,
      required: [true, "La durée (en minutes) est obligatoire."],
      min: [5, "La durée minimale est de 5 minutes."]
    },
    mainOeuvre: {
      type: Number,
      required: [true, "Le coût de la main d'œuvre est obligatoire."],
      min: [0, "Le coût ne peut pas être négatif."]
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Prestation", PrestationSchema);