const cron = require('node-cron');
const Prescription = require('../models/Prescription');
const Notification = require('../models/Notification');

const initRefillCron = () => {
    // Run every day at 9:00 AM
    cron.schedule('0 9 * * *', async () => {
        console.log('Running Refill Reminder Cron Job...');
        try {
            const threeDaysFromNow = new Date();
            threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

            const upcomingRefills = await Prescription.find({
                nextRefillDate: { $lte: threeDaysFromNow }
            }).populate('customer');

            for (const presc of upcomingRefills) {
                // Check if a notification already exists for this refill to avoid spam
                const existing = await Notification.findOne({
                    user: presc.customer._id,
                    title: 'Refill Reminder',
                    createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
                });

                if (!existing) {
                    await Notification.create({
                        user: presc.customer._id,
                        title: 'Refill Reminder',
                        message: `Friendly reminder: Your refill for ${presc.medicineName} is due by ${new Date(presc.nextRefillDate).toLocaleDateString()}.`,
                        type: 'warning'
                    });
                }
            }
            console.log(`Sent ${upcomingRefills.length} refill reminders.`);
        } catch (error) {
            console.error('Refill Cron Error:', error);
        }
    });
};

module.exports = initRefillCron;
