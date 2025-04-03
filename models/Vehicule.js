const mongoose = require("mongoose");

const VehiculeSchema = new mongoose.Schema(
  {
    marque: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Marque",
      required: [true, "Veuillez spécifier la marque."],
    },
    matricule: {
      type: String,
      required: [true, "Veuillez entrer la plaque d'immatriculation."],
    },
    proprietaire: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Veuillez indiquer le propriétaire."],
    },
    modele: String, 
    annee: Number   
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vehicule", VehiculeSchema);