const cron = require('node-cron');
const Prescription = require('../models/Prescription');
const Notification = require('../models/Notification');
const Request = require('../models/Request');

const { calculateRequiredStock } = require('../controllers/requestController');

const initRefillCron = () => {
    // Run every day at 9:00 AM
    cron.schedule('0 9 * * *', async () => {
        console.log('Running Automatic Refill Detection Cron Job...');
        try {
            const fiveDaysFromNow = new Date();
            fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5);

            // Find prescriptions due within 5 days that haven't been auto-notified yet
            const upcomingRefills = await Prescription.find({
                nextRefillDate: { $lte: fiveDaysFromNow },
                refillNotified: false
            }).populate('customer');

            for (const presc of upcomingRefills) {
                console.log(`Auto-refilling for ${presc.medicineName} (Customer: ${presc.customer?.name})`);

                const calc = calculateRequiredStock(presc.dosage, presc.refillDays);

                // 1. Create the Automatic Request for the Retailer
                await Request.create({
                    customer: presc.customer._id,
                    medicineName: presc.medicineName,
                    type: 'auto-refill',
                    status: 'Pending',
                    prescriptionId: presc._id,
                    totalTablets: calc.totalTablets,
                    requiredStock: calc.requiredStock
                });

                // 2. Notify the Customer
                await Notification.create({
                    user: presc.customer._id,
                    title: 'Auto Refill Initiated',
                    message: `Your refill for ${presc.medicineName} is due soon. We have automatically sent a request to the retailer for you.`,
                    type: 'info'
                });

                // 3. Mark as notified so we don't repeat this for this specific refill cycle
                presc.refillNotified = true;
                await presc.save();
            }

            console.log(`Processed ${upcomingRefills.length} automatic refills.`);
        } catch (error) {
            console.error('Refill Cron Error:', error);
        }
    });
};

module.exports = initRefillCron;
