const express = require('express');
const { addPrescription, getMyPrescriptions, deletePrescription } = require('../controllers/prescriptionController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const router = express.Router();

router.route('/')
    .get(protect, getMyPrescriptions)
    .post(protect, upload.single('image'), addPrescription);

router.route('/:id').delete(protect, deletePrescription);

module.exports = router;
