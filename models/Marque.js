const mongoose = require("mongoose");
const MarqueSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true, unique : true }
  },
  { timestamps: true }
);
module.exports = mongoose.model("Marque", MarqueSchema);