const mongoose = require("mongoose");

const MecanicienSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Veuillez indiquer l'utilisateur."],
    },
    dateEmbauche: {
      type: Date,
      default: null,
    },
    dateRenvoie: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Mecanicien", MecanicienSchema);
