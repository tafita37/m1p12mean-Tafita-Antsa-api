const express = require("express");
const router = express.Router();
const controller = require("../controllers/vehicule.controller");


router.post("/", controller.create);
router.get("/:id", controller.findById);
router.get("/user/:id", controller.findByUser);
router.get("/", controller.findAll);
router.put("/:id", controller.update);
router.delete("/:id", controller.delete);

module.exports = router;