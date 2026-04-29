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
    retailerMessage: { type: String }, // General messages
    rejectReason: { type: String }, // Mapped from checklist (Out of stock, etc.)
    pharmacistNote: { type: String }, // Custom note from pharmacist
    notified: { type: Boolean, default: false },
    prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' },
    dosage: { type: String }, 
    refillDays: { type: Number }, 
    totalTablets: { type: Number },
    requiredStock: { type: Number, default: 1 },
    isEmergency: { type: Boolean, default: false }, // Emergency priority flag
    retailer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Request', requestSchema);
