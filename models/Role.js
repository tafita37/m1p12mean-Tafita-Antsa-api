const mongoose = require("mongoose");
const RoleSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true, unique : true },
    niveau: { type: Number, required: true, unique : true },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Role", RoleSchema);
