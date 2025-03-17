const mongoose = require("mongoose");

const DetailPieceSchema = new mongoose.Schema(
  {
    piece: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Piece",
      required: true,
    },
    marque: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Marque",
      required: true,
    },
    prixAchat: {
      type: Number,
      required: true,
    },
    prixVente: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DetailPiece", DetailPieceSchema);