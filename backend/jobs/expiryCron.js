const cron = require('node-cron');
const Medicine = require('../models/Medicine');
const Notification = require('../models/Notification');

const initExpiryCron = () => {
    // Run every day at 10:00 AM
    cron.schedule('0 10 * * *', async () => {
        console.log('Running Medicine Expiry Detection Cron Job...');
        try {
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

            // Find medicines with batches expiring within 30 days
            const medicines = await Medicine.find({
                'batches.expiryDate': { $lte: thirtyDaysFromNow, $gt: new Date() }
            });

            for (const med of medicines) {
                // Find specific batches that are expiring
                const expiringBatches = med.batches.filter(b => 
                    new Date(b.expiryDate) <= thirtyDaysFromNow && new Date(b.expiryDate) > new Date()
                );

                if (expiringBatches.length > 0) {
                    await Notification.create({
                        user: med.retailer,
                        title: '⚠️ Expiry Warning',
                        message: `${med.name} (Batch: ${expiringBatches.map(b => b.batchNumber).join(', ')}) is expiring within 30 days.`,
                        type: 'warning'
                    });
                }
            }

            // Find medicines that have already expired
            const expiredMeds = await Medicine.find({
                'batches.expiryDate': { $lte: new Date() }
            });

            for (const med of expiredMeds) {
                const alreadyExpired = med.batches.filter(b => new Date(b.expiryDate) <= new Date());
                if (alreadyExpired.length > 0) {
                    await Notification.create({
                        user: med.retailer,
                        title: '❌ Expired Inventory Alert',
                        message: `${med.name} (Batch: ${alreadyExpired.map(b => b.batchNumber).join(', ')}) has expired! Please remove from active stock.`,
                        type: 'danger'
                    });
                }
            }

        } catch (error) {
            console.error('Expiry Cron Error:', error);
        }
    });
};

module.exports = initExpiryCron;
