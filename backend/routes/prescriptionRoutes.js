const express = require('express');
const { addPrescription, getMyPrescriptions, deletePrescription } = require('../controllers/prescriptionController');
const { protect, customer } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const router = express.Router();

router.route('/')
    .get(protect, customer, getMyPrescriptions)
    .post(protect, customer, upload.single('image'), addPrescription);

router.route('/:id').delete(protect, customer, deletePrescription);

module.exports = router;
