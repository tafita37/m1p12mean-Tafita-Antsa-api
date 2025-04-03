const mongoose = require("mongoose");

const ServiceSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, "Le nom du service est obligatoire."],
      unique: true
    },
    prestations: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prestation",
      required: [true, "Au moins une prestation est requise."]
    }]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Service", ServiceSchema);