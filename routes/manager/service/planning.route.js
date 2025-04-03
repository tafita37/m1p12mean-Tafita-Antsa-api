const express = require('express');
const router = express.Router();
const controller = require('../../../controllers/planning.controller');

router.post('/', controller.create);
router.get('/', controller.findAll);

router.get('/mechanic/:id', controller.findPlanningMechanic);

module.exports = router;
