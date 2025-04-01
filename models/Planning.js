const mongoose = require("mongoose");

const PlanningSchema = new mongoose.Schema(
  {
    demande: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Demande",
    },
    sousService: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "SousService",
    },
    mecanicien: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Mecanicien",
    },
    qte: {
      type: Number,
      required: true,
    },
    dateHeureDebut: {
      type: Date,
      required: true,
    },
    estimationTotal: {
      type: Number,
      required: true,
      //   default: 0,
    },
    tempsPasse: {
      type: Number,
      default: 0,
    },
    resteAFaire: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Planning", PlanningSchema);
