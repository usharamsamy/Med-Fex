const express = require('express');
const { createRequest, getCustomerRequests, getRetailerRequests, updateRequestStatus } = require('../controllers/requestController');
const { protect, retailer } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/')
    .post(protect, createRequest)
    .get(protect, getCustomerRequests);

router.get('/retailer', protect, retailer, getRetailerRequests);
router.put('/:id/status', protect, retailer, updateRequestStatus);

module.exports = router;
