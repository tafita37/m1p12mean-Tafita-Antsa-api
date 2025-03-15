const mongoose = require("mongoose");
const PieceSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true, unique : true }
  },
  { timestamps: true }
);
module.exports = mongoose.model("Piece", PieceSchema);