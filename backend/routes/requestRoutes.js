const express = require('express');
const { createRequest, getCustomerRequests, getRetailerRequests, updateRequestStatus, completeRequest, reRequest, notifyRestockedCustomers, getRequestById, logInvoiceDownload, downloadInvoice, getRestockAlerts, restockMedicine } = require('../controllers/requestController');
const { protect, retailer, customer } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/')
    .post(protect, customer, createRequest)
    .get(protect, customer, getCustomerRequests);

router.post('/re-request/:id', protect, customer, reRequest);
router.post('/notify-restocked', protect, retailer, notifyRestockedCustomers);
router.post('/restock', protect, retailer, restockMedicine);

router.get('/retailer', protect, retailer, getRetailerRequests);
router.get('/restock-alerts', protect, retailer, getRestockAlerts);
router.get('/:id/invoice', protect, downloadInvoice);
router.get('/:id', protect, getRequestById);
router.put('/:id/status', protect, retailer, updateRequestStatus);
router.put('/:id/complete', protect, retailer, completeRequest);
router.post('/:id/log-invoice', protect, logInvoiceDownload);

module.exports = router;
