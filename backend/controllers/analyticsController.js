const Request = require('../models/Request');
const Medicine = require('../models/Medicine');
const ActivityLog = require('../models/ActivityLog');

const getRecentActivity = async (req, res) => {
    try {
        const { page = 1, search = '', role = '', actionType = '', startDate, endDate } = req.query;
        const limit = 20;
        const skip = (page - 1) * limit;

        const query = {};
        
        // Scoping: In a real app, admins see all, retailers see shop-related. 
        // For this task, we'll allow retailers to see the activity of the system.
        
        if (search) {
            query.$or = [
                { action: { $regex: search, $options: 'i' } },
                { details: { $regex: search, $options: 'i' } },
                { userName: { $regex: search, $options: 'i' } }
            ];
        }

        if (role) {
            query.userRole = role;
        }

        if (actionType) {
            query.action = { $regex: actionType, $options: 'i' };
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const activities = await ActivityLog.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
        const total = await ActivityLog.countDocuments(query);

        res.json({
            activities,
            total,
            pages: Math.ceil(total / limit)
        });
    } catch (err) {
        console.error('Activity Fetch Error:', err);
        res.status(500).json({ message: 'Error fetching activity logs' });
    }
};

const getInventoryPrediction = async (req, res) => {
    try {
        const medicines = await Medicine.find({ retailer: req.user._id });
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Find all completed requests in the last 30 days
        const recentRequests = await Request.find({
            retailer: req.user._id,
            status: 'Completed',
            updatedAt: { $gte: thirtyDaysAgo }
        });

        // Calculate total demand per medicine
        const demandByMedicine = {};
        recentRequests.forEach(req => {
            const medName = req.medicineName?.toLowerCase();
            if (medName) {
                if (!demandByMedicine[medName]) {
                    demandByMedicine[medName] = 0;
                }
                // Use requiredStock or fallback to calculated tablets/10
                let stockDeducted = req.requiredStock;
                if (!stockDeducted && req.totalTablets) {
                    stockDeducted = Math.ceil(req.totalTablets / 10);
                }
                demandByMedicine[medName] += stockDeducted || 1; // fallback 1
            }
        });

        const predictions = medicines.map(med => {
            const medName = med.name.toLowerCase();
            const thirtyDayDemand = demandByMedicine[medName] || 0;
            const dailyBurnRate = thirtyDayDemand / 30;
            
            let daysUntilEmpty = null;
            if (dailyBurnRate > 0) {
                daysUntilEmpty = Math.floor(med.stock / dailyBurnRate);
            }

            let suggestedRestock = 0;
            if (daysUntilEmpty !== null && daysUntilEmpty <= 15) {
                // Suggest enough stock to last 30 days
                const targetStock = Math.ceil(dailyBurnRate * 30);
                suggestedRestock = Math.max(0, targetStock - med.stock);
            }

            return {
                medicineId: med._id,
                name: med.name,
                stock: med.stock,
                thirtyDayDemand,
                dailyBurnRate: parseFloat(dailyBurnRate.toFixed(2)),
                daysUntilEmpty, // null means no demand, so infinite days
                suggestedRestock,
                status: daysUntilEmpty !== null && daysUntilEmpty <= 7 ? 'Critical' : (daysUntilEmpty !== null && daysUntilEmpty <= 15 ? 'Warning' : 'Healthy')
            };
        });

        res.json(predictions);
    } catch (err) {
        console.error('Prediction Error:', err);
        res.status(500).json({ message: 'Error generating inventory prediction' });
    }
};

const getSalesReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = { retailer: req.user._id, status: 'Completed' };
        
        if (startDate && endDate) {
            query.updatedAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const sales = await Request.find(query)
            .populate('customer', 'name email')
            .sort({ updatedAt: -1 });

        res.json(sales);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching sales report' });
    }
};

const getDemandInsights = async (req, res) => {
    try {
        const counts = await Request.aggregate([
            { $match: { retailer: req.user._id } },
            { $group: { _id: "$medicineName", count: { $sum: 1 }, requests: { $push: "$$ROOT" } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        res.json(counts);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching demand insights' });
    }
};

const getDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [medicines, requests] = await Promise.all([
            Medicine.find({ retailer: req.user._id }),
            Request.find({ status: 'Pending', createdAt: { $gte: today } }) 
        ]);

        const completedToday = await Request.find({ 
            retailer: req.user._id,
            status: 'Completed', 
            updatedAt: { $gte: today } 
        });

        // Calculate today's revenue
        let todayRevenue = 0;
        for (const req of completedToday) {
            const med = medicines.find(m => m.name.toLowerCase() === req.medicineName.toLowerCase());
            const price = med ? med.price : 0;
            const qty = req.requiredStock || 1;
            todayRevenue += price * qty;
        }

        const stats = {
            totalMedicines: medicines.length,
            lowStockCount: medicines.filter(m => m.stock < 10).length,
            pendingRequests: await Request.countDocuments({ status: 'Pending' }),
            myActiveOrders: await Request.countDocuments({ 
                retailer: req.user._id, 
                status: { $in: ['Accepted', 'Ready for Pickup'] } 
            }),
            todayRequests: requests.length,
            todayRevenue: todayRevenue
        };

        res.json(stats);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching dashboard stats' });
    }
};

module.exports = { getInventoryPrediction, getRecentActivity, getSalesReport, getDemandInsights, getDashboardStats };
