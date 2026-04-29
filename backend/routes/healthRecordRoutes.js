const express = require('express');
const router = express.Router();
const { getHealthRecords, addHealthRecord, deleteHealthRecord } = require('../controllers/healthRecordController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getHealthRecords);
router.post('/', protect, addHealthRecord);
router.delete('/:id', protect, deleteHealthRecord);

module.exports = router;
