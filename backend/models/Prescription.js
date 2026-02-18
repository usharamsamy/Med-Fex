const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    medicineName: { type: String, required: true },
    dosage: { type: String, required: true },
    refillDays: { type: Number, required: true }, // Changed from refillDuration for consistency
    startDate: { type: Date, default: Date.now },
    nextRefillDate: { type: Date },
    prescriptionImage: { type: String }
}, { timestamps: true });

prescriptionSchema.pre('save', async function () {
    if (this.isModified('startDate') || this.isModified('refillDays')) {
        const nextDate = new Date(this.startDate);
        const days = Number(this.refillDays) || 0;
        nextDate.setDate(nextDate.getDate() + days);
        this.nextRefillDate = nextDate;
    }
});

module.exports = mongoose.model('Prescription', prescriptionSchema);
