const mongoose = require("mongoose");
const PieceSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true, unique : true },
    type: { type: Number, required: true },
    prixReparation: { type: Number, default: null },
    prixRemplacement: { type: Number, required: true },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Piece", PieceSchema);