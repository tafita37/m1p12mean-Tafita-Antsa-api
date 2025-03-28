const mongoose = require("mongoose");

const sousServiceSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  prix: { type: Number, required: true },
//   dateSuppression: {
//     type: Date,
//     default: null, // Champ nullable par défaut
//   },
});

const SousService = mongoose.model("SousService", sousServiceSchema);
module.exports = SousService;