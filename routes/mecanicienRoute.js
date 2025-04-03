const express = require("express");
const router = express.Router();

router.use("/rdv", require("./mecanicien/rdvRoute"));

module.exports = router;
