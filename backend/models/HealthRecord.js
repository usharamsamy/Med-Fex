const mongoose = require('mongoose');

const healthRecordSchema = new mongoose.Schema({
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, default: Date.now },
    type: { 
        type: String, 
        enum: ['Vital', 'Note', 'Condition', 'Allergy'], 
        required: true 
    },
    value: { type: String, required: true }, // e.g. "75kg", "120/80 mmHg", "Asthma"
    metric: { type: String }, // e.g. "Weight", "BP", "Condition Name"
    notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('HealthRecord', healthRecordSchema);
