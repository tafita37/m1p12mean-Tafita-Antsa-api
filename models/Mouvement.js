const mongoose = require("mongoose");

const mouvementSchema = new mongoose.Schema({
  detailPiece: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DetailPiece",
    required: true,
  },
  utilisateur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  fournisseur: { type: mongoose.Schema.Types.ObjectId, ref: "Fournisseur" },
  prix: { type: Number, required: true },
  nb: { type: Number, required: true },
  sortie: { type: Number, default : 0},
  isEntree: { type: Boolean, default : 0},
  dateMouvement: { type: Date, default: Date.now }
});

const Mouvement = mongoose.model("Mouvement", mouvementSchema);

module.exports = Mouvement;
