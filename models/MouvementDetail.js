const mongoose = require("mongoose");

const MouvementDetailSchema = new mongoose.Schema(
  {
    mouvementEntree: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mouvement",
      required: true,
    },
    mouvementSortie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mouvement",
      required: true,
    },
    nb: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const MouvementDetail = mongoose.model(
  "MouvementDetail",
  MouvementDetailSchema
);

module.exports = MouvementDetail;
