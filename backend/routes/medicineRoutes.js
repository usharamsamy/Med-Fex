const express = require('express');
const { getMedicines, createMedicine, createBulkMedicines, updateMedicine, deleteMedicine, searchMedicineAvailability } = require('../controllers/medicineController');
const { protect, retailer, customer } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/search', protect, customer, searchMedicineAvailability);
router.get('/alternatives', protect, customer, require('../controllers/medicineController').getAlternatives);
router.post('/bulk', protect, retailer, createBulkMedicines);
router.route('/')
    .get(protect, retailer, getMedicines)
    .post(protect, retailer, createMedicine);
router.route('/:id')
    .put(protect, retailer, updateMedicine)
    .delete(protect, retailer, deleteMedicine);

module.exports = router;
