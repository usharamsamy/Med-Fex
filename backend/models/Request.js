const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    medicineName: { type: String, required: true },
    type: { type: String, enum: ['refill', 'new', 'auto-refill'], required: true },
    status: {
        type: String,
        enum: ['Pending', 'Accepted', 'Ready for Pickup', 'Completed', 'Rejected'],
        default: 'Pending'
    },
    retailerMessage: { type: String },
    rejectionReason: { type: String }, // e.g., 'Out of Stock'
    notified: { type: Boolean, default: false },
    prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' },
    totalTablets: { type: Number },
    requiredStock: { type: Number, default: 1 }
}, { timestamps: true });

module.exports = mongoose.model('Request', requestSchema);
