const Medicine = require('../models/Medicine');
const { notifyCustomersOnRestock } = require('../services/notificationService');

const getMedicines = async (req, res) => {
    const medicines = await Medicine.find({ retailer: req.user._id });
    res.json(medicines);
};

const createMedicine = async (req, res) => {
    try {
        const body = req.body || {};
        const { name, category, price, stock, description } = body;

        if (!name || !price) {
            return res.status(400).json({ message: 'Name and price are required' });
        }

        if (Number(price) < 0 || (stock !== undefined && Number(stock) < 0)) {
            return res.status(400).json({ message: 'Price and stock cannot be negative' });
        }

        const medicine = new Medicine({
            name: name?.trim(),
            category,
            price,
            stock,
            description,
            retailer: req.user._id
        });
        const createdMedicine = await medicine.save();

        // Trigger notification if stock is restored
        if (createdMedicine.stock > 0) {
            await notifyCustomersOnRestock(createdMedicine.name);
        }

        res.status(201).json(createdMedicine);
    } catch (error) {
        res.status(500).json({ message: 'Error creating medicine' });
    }
};

const updateMedicine = async (req, res) => {
    try {
        const body = req.body || {};
        const { name, category, price, stock, description } = body;

        if ((price !== undefined && Number(price) < 0) || (stock !== undefined && Number(stock) < 0)) {
            return res.status(400).json({ message: 'Price and stock cannot be negative' });
        }

        const medicine = await Medicine.findById(req.params.id);

        if (medicine && medicine.retailer.toString() === req.user._id.toString()) {
            medicine.name = name?.trim() || medicine.name;
            medicine.category = category || medicine.category;
            medicine.price = price || medicine.price;
            medicine.stock = stock || medicine.stock;
            medicine.description = description || medicine.description;

            const updatedMedicine = await medicine.save();

            // Trigger notification if stock is restored
            if (updatedMedicine.stock > 0) {
                await notifyCustomersOnRestock(updatedMedicine.name);
            }

            res.json(updatedMedicine);
        } else {
            res.status(404).json({ message: 'Medicine not found or unauthorized' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating medicine' });
    }
};

const deleteMedicine = async (req, res) => {
    const medicine = await Medicine.findById(req.params.id);
    if (medicine && medicine.retailer.toString() === req.user._id.toString()) {
        await medicine.deleteOne();
        res.json({ message: 'Medicine removed' });
    } else {
        res.status(404).json({ message: 'Medicine not found or unauthorized' });
    }
};

const searchMedicineAvailability = async (req, res) => {
    try {
        let { name } = req.query;
        if (!name) return res.status(400).json({ message: 'Search term is required' });

        // Normalize: Trim and split into words to create flexible matches
        const terms = name.trim().split(/\s+/).map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        const searchRegex = new RegExp(terms.join('.*'), 'i');

        console.log(`Searching for: "${name}" with regex: ${searchRegex}`);

        const count = await Medicine.countDocuments();
        console.log(`Total medicines in DB: ${count}`);

        const medicines = await Medicine.find({
            name: { $regex: searchRegex }
        }).populate('retailer', 'name email');

        console.log(`Found ${medicines.length} matches`);
        res.json(medicines);
    } catch (error) {
        console.error('Search Error:', error);
        res.status(500).json({ message: 'Error searching medicines', error: error.message });
    }
};

module.exports = { getMedicines, createMedicine, updateMedicine, deleteMedicine, searchMedicineAvailability };
