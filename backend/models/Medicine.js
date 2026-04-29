const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
    batchNumber: { type: String, required: true },
    mfgDate: { type: Date },
    expiryDate: { type: Date, required: true },
    stock: { type: Number, required: true, min: 0 }
});

const medicineSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, default: 0, min: 0 },
    batches: [batchSchema],
    description: { type: String },
    retailer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Medicine', medicineSchema);
