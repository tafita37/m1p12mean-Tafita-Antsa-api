const mongoose = require("mongoose");

const ClientSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Veuillez indiquer l'utilisateur."],
    },
    typeClient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TypeClient",
      required: [true, "Veuillez entrer le type de client."],
    }
  },
  { timestamps: true }
);
module.exports = mongoose.model("Client", ClientSchema);
