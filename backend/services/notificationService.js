const Request = require('../models/Request');
const Notification = require('../models/Notification');

/**
 * Automatically notifies customers who had requests rejected due to "Out of Stock"
 * when the medicine stock is restored (> 0).
 */
const notifyCustomersOnRestock = async (medicineName) => {
    try {
        console.log(`Checking for restock notifications for: ${medicineName}`);

        // Find all requests for this medicine that were rejected due to 'Out of Stock' and haven't been notified yet
        // Using regex for case-insensitive matching
        const pendingRequests = await Request.find({
            medicineName: { $regex: new RegExp(`^${medicineName.trim()}$`, 'i') },
            status: 'Rejected',
            rejectionReason: 'Out of Stock',
            notified: false
        });

        if (pendingRequests.length === 0) {
            console.log('No pending restock notifications found.');
            return;
        }

        console.log(`Found ${pendingRequests.length} customers to notify.`);

        for (const req of pendingRequests) {
            // Create a notification for the customer
            await Notification.create({
                user: req.customer,
                title: 'Medicine Back in Stock!',
                message: `Good news! The medicine you requested (${req.medicineName}) is now back in stock. You can place a refill request at your convenience.`,
                type: 'success'
            });

            // Mark the request as notified to prevent duplicate notifications
            req.notified = true;
            await req.save();
        }

        console.log('Restock notifications sent successfully.');
    } catch (error) {
        console.error('Error in notifyCustomersOnRestock service:', error);
    }
};

module.exports = { notifyCustomersOnRestock };
