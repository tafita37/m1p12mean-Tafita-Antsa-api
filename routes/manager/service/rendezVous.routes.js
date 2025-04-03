const express = require('express');
const router = express.Router();
const controller = require('../../../controllers/rendezVous.controller');

router.post('/', controller.create);
router.get('/', controller.findAll);
router.get('/:id', controller.findById);
router.put('/:id/status', controller.updateStatus);
router.delete('/:id', controller.delete);

router.get('/type/devis', (req, res, next) => {
    req.query.type = 'devis';
    return controller.findAll(req, res, next);
});

router.get('/type/standard', (req, res, next) => {
    req.query.type = 'standard';
    return controller.findAll(req, res, next);
});

router.patch('/:id', controller.rejectAppointment);
router.patch('/accept/:id', controller.acceptAppointment);

router.get('/pending/list',controller.findPendingAppointments);


module.exports = router;