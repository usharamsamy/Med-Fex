const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String },
    price: { type: Number, required: true },
    stock: { type: Number, required: true, default: 0 },
    description: { type: String },
    retailer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Medicine', medicineSchema);
