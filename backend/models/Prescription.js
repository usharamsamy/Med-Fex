const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    medicineName: { type: String, required: true },
    dosage: { type: String, required: true },
    refillDuration: { type: Number, required: true }, // in days
    startDate: { type: Date, default: Date.now },
    nextRefillDate: { type: Date }
}, { timestamps: true });

prescriptionSchema.pre('save', async function () {
    if (this.isModified('startDate') || this.isModified('refillDuration')) {
        const nextDate = new Date(this.startDate);
        nextDate.setDate(nextDate.getDate() + Number(this.refillDuration));
        this.nextRefillDate = nextDate;
    }
});

module.exports = mongoose.model('Prescription', prescriptionSchema);
