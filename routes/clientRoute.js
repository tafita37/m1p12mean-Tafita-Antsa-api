const express = require("express");
const router = express.Router();

router.use("/voiture", require("./client/voitureRoute"));
router.use("/rdv", require("./client/rdvRoute"));

module.exports = router;