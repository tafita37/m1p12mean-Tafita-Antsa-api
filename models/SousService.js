const mongoose = require("mongoose");

const SousServiceSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true },
    prix: { type: Number, required: true },
    dureeMinute: { type: Number, required: true },
    pieces: [
      {
        piece: { type: mongoose.Schema.Types.ObjectId, ref: "Piece" },
        etat: { type: Number },
      },
    ],
  },
  {
    default: { pieces: [] },
  }
);

const SousService = mongoose.model("SousService", SousServiceSchema);
module.exports = SousService;