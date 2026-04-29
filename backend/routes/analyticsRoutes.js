const express = require('express');
const {
    getInventoryPrediction,
    getRecentActivity,
    getSalesReport,
    getDemandInsights,
    getDashboardStats
} = require('../controllers/analyticsController');
const { protect, retailer } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/activity', protect, retailer, getRecentActivity);
router.get('/inventory-prediction', protect, retailer, getInventoryPrediction);
router.get('/sales-report', protect, retailer, getSalesReport);
router.get('/demand-insights', protect, retailer, getDemandInsights);
router.get('/dashboard-stats', protect, retailer, getDashboardStats);

module.exports = router;
