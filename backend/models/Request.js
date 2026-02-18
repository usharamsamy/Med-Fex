const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    medicineName: { type: String, required: true },
    type: { type: String, enum: ['refill', 'new'], required: true },
    status: {
        type: String,
        enum: ['Pending', 'Accepted', 'Ready for Pickup', 'Rejected'],
        default: 'Pending'
    },
    retailerMessage: { type: String },
    prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' }
}, { timestamps: true });

module.exports = mongoose.model('Request', requestSchema);
