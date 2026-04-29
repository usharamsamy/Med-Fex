const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Medicine = require('./models/Medicine');
const Request = require('./models/Request');
const { calculateRequiredStock } = require('./controllers/requestController');

dotenv.config({ path: './.env' });

const testStockDeduction = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Create a test medicine
        const medicine = await Medicine.create({
            name: 'Test Med ' + Date.now(),
            price: 100,
            stock: 10,
            retailer: new mongoose.Types.ObjectId(), // dummy
        });
        console.log(`Created medicine: ${medicine.name} with stock: ${medicine.stock}`);

        // 2. Mock a request
        // Dosage 1-1-1, Refill 10 days = 30 tablets = 3 units
        const dosage = '1-1-1';
        const refillDays = 10;
        const calc = calculateRequiredStock(dosage, refillDays);
        console.log(`Calculated tablets: ${calc.totalTablets}, req stock: ${calc.requiredStock}`);

        if (calc.requiredStock !== 3) {
            throw new Error(`Expected stock 3, got ${calc.requiredStock}`);
        }

        const request = await Request.create({
            customer: new mongoose.Types.ObjectId(), // dummy
            medicineName: medicine.name,
            type: 'new',
            status: 'Ready for Pickup',
            dosage,
            refillDays,
            totalTablets: calc.totalTablets,
            requiredStock: calc.requiredStock
        });
        console.log(`Created request for ${request.medicineName}`);

        // 3. Simulate deduction (we'll just run the logic manually to verify the formula works and then atomic update)
        const deductionQty = calculateRequiredStock(request.dosage, request.refillDays).requiredStock;
        
        const updatedMed = await Medicine.findByIdAndUpdate(
            medicine._id,
            { $inc: { stock: -deductionQty } },
            { new: true }
        );

        console.log(`New stock: ${updatedMed.stock}`);
        if (updatedMed.stock === 7) {
            console.log('✅ TEST PASSED: Stock reduced correctly from 10 to 7.');
        } else {
            console.log(`❌ TEST FAILED: Expected stock 7, got ${updatedMed.stock}`);
        }

        // Cleanup
        await Medicine.findByIdAndDelete(medicine._id);
        await Request.findByIdAndDelete(request._id);
        
        await mongoose.disconnect();
    } catch (err) {
        console.error('Test Error:', err);
        process.exit(1);
    }
};

testStockDeduction();
