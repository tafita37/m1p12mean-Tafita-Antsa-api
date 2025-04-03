
const mongoose = require("mongoose");

const PlanningSchema = new mongoose.Schema({
    appointment: {type: mongoose.Schema.Types.ObjectId, ref: "RendezVous", required: true},
    mechanic: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    date: {type: Date, required: true}
}) 

module.exports = mongoose.model("Planning",PlanningSchema);
