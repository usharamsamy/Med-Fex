const Medicine = require('../models/Medicine');
const Prescription = require('../models/Prescription');

const getPersonalizedSuggestions = async (req, res) => {
    try {
        // 1. Get user's current prescription categories
        const myPrescriptions = await Prescription.find({ customer: req.user._id });

        if (myPrescriptions.length === 0) {
            // If no history, return top rated or general medicines
            const generalSuggestions = await Medicine.find({ stock: { $gt: 0 } }).limit(4);
            return res.json(generalSuggestions);
        }

        const medicineNames = myPrescriptions.map(p => p.medicineName);

        // Find categories for these medicines
        const prescribedMedicines = await Medicine.find({
            name: { $in: medicineNames.map(name => new RegExp(name, 'i')) }
        });

        const categories = [...new Set(prescribedMedicines.map(m => m.category))];

        // 2. Find other medicines in those categories that the user hasn't prescribed yet
        const suggestions = await Medicine.find({
            category: { $in: categories },
            name: { $nin: medicineNames.map(name => new RegExp(name, 'i')) },
            stock: { $gt: 0 }
        }).limit(4);

        // 3. Fallback if no category matches
        if (suggestions.length < 2) {
            const extra = await Medicine.find({
                name: { $nin: medicineNames.map(name => new RegExp(name, 'i')) },
                stock: { $gt: 0 }
            }).limit(4 - suggestions.length);
            return res.json([...suggestions, ...extra]);
        }

        res.json(suggestions);
    } catch (error) {
        console.error('Suggestions Error:', error);
        res.status(500).json({ message: 'Error fetching suggestions' });
    }
};

module.exports = { getPersonalizedSuggestions };
