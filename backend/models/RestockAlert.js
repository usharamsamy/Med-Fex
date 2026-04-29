const mongoose = require('mongoose');

const restockAlertSchema = new mongoose.Schema({
    medicineName: { type: String, required: true },
    rejectCount: { type: Number, default: 1 },
    lastRequested: { type: Date, default: Date.now },
    notified: { type: Boolean, default: false },
    retailer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Ensure unique medicineName per retailer
restockAlertSchema.index({ medicineName: 1, retailer: 1 }, { unique: true });

module.exports = mongoose.model('RestockAlert', restockAlertSchema);
