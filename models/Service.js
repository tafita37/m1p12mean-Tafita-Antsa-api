const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
  nom: { type: String, required: true, unique : true },
  sousServices: [
    { type: mongoose.Schema.Types.ObjectId, ref: "SousService" },
  ],
});

const Service = mongoose.model("Service", serviceSchema);
module.exports = Service;