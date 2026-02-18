const express = require('express');
const { getMedicines, createMedicine, updateMedicine, deleteMedicine, searchMedicineAvailability } = require('../controllers/medicineController');
const { protect, retailer } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/search', protect, searchMedicineAvailability);
router.route('/')
    .get(protect, retailer, getMedicines)
    .post(protect, retailer, createMedicine);
router.route('/:id')
    .put(protect, retailer, updateMedicine)
    .delete(protect, retailer, deleteMedicine);

module.exports = router;
