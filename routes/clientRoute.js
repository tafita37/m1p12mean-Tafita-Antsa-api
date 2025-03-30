const express = require("express");
const router = express.Router();

router.use("/voiture", require("./client/voitureRoute"));

module.exports = router;