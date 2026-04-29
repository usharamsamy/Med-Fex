const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    retailer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional: global categories or retailer-specific
    description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
