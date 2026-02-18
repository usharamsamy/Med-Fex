const express = require('express');
const { createRequest, getCustomerRequests, getRetailerRequests, updateRequestStatus, completeRequest } = require('../controllers/requestController');
const { protect, retailer } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/')
    .post(protect, createRequest)
    .get(protect, getCustomerRequests);

router.get('/retailer', protect, retailer, getRetailerRequests);
router.put('/:id/status', protect, retailer, updateRequestStatus);
router.put('/:id/complete', protect, retailer, completeRequest);

module.exports = router;
