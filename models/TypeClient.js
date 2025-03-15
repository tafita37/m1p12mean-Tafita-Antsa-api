const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const TypeClientSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, "Le nom est requis."],
      trim: true,
      unique : true
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
