const mongoose = require("mongoose");

const RendezVousSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["standard", "devis"],
      validate: {
        validator: function (v) {
          return v === "standard" || v === "devis";
        },
        message: "Vous devez choisir entre 'standard' ou 'devis'",
      },
    },
    vehiculeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicule",
      required: true,
    },
    dateRdv: {
      type: Date,
      required: true,
      // validate: {
      //   validator: function (date) {
      //     return date > new Date();
      //   },
      //   message: "La date doit être dans le futur",
      // },
    },
    status: {
      type: String,
      enum: ["en attente", "accepté", "rejeté", "terminé"],
      default: "en attente",
    },

    prestations: {
      type: [
        {
          prestationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Prestation",
            required: true,
          },
          pieces: [
            {
              pieceId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Piece",
                required: true,
              },
            },
          ],
        },
      ],
      required: function () {
        return this.type === "standard";
      },
    },

    demandeDevis: {
      description: {
        type: String,
      },
      photos: [String],
      status: {
        type: String,
        enum: ["en attente", "accepté", "rejeté"],
        default: "en attente",
      },
    },

    motif: {type: String, required: false},

    DateConfirmation: Date,
    notes: String,
  },
  {
    timestamps: true,
    strict: "throw",
  }
);


module.exports = mongoose.model("RendezVous", RendezVousSchema);
