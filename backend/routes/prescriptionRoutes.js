const express = require('express');
const { addPrescription, getMyPrescriptions, deletePrescription } = require('../controllers/prescriptionController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/')
    .post(protect, addPrescription)
    .get(protect, getMyPrescriptions);

router.delete('/:id', protect, deletePrescription);

module.exports = router;
