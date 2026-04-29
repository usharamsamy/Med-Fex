const Medicine = require('../models/Medicine');
const { notifyCustomersOnRestock } = require('../services/notificationService');
const { logActivity } = require('../services/activityService');

const getMedicines = async (req, res) => {
    const medicines = await Medicine.find({ retailer: req.user._id });
    res.json(medicines);
};

const createMedicine = async (req, res) => {
    try {
        const body = req.body || {};
        const { name, category, price, stock, batches, description } = body;

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
            batches: batches || [],
            description,
            retailer: req.user._id
        });
        const createdMedicine = await medicine.save();

        // Trigger notification if stock is restored
        if (createdMedicine.stock > 0) {
            await notifyCustomersOnRestock(createdMedicine.name);
        }

        await logActivity(req.user, 'Added Medicine', `${createdMedicine.name} added with stock ${createdMedicine.stock}`, createdMedicine._id);

        res.status(201).json(createdMedicine);
    } catch (error) {
        res.status(500).json({ message: 'Error creating medicine' });
    }
};

    const createBulkMedicines = async (req, res) => {
        try {
            const { medicines } = req.body;
            if (!Array.isArray(medicines) || medicines.length === 0) {
                return res.status(400).json({ message: 'No valid medicines provided in bulk array' });
            }

            const newMeds = medicines.map(m => ({
                name: m.name?.trim(),
                category: m.category || 'General',
                price: Number(m.price) || 0,
                stock: Number(m.stock) || 0,
                retailer: req.user._id
            })).filter(m => m.name && m.price >= 0 && m.stock >= 0);

            const inserted = await Medicine.insertMany(newMeds);
            await logActivity(req.user, 'Bulk Medicine Upload', `Successfully uploaded ${inserted.length} medicines from CSV`);
            
            res.status(201).json({ message: `Successfully added ${inserted.length} medicines`, inserted });
        } catch (error) {
            console.error('Bulk Upload Error:', error);
            res.status(500).json({ message: 'Error in bulk medicine upload' });
        }
    };

const updateMedicine = async (req, res) => {
    try {
        const body = req.body || {};
        const { name, category, price, stock, batches, description } = body;

        if ((price !== undefined && Number(price) < 0) || (stock !== undefined && Number(stock) < 0)) {
            return res.status(400).json({ message: 'Price and stock cannot be negative' });
        }

        const medicine = await Medicine.findById(req.params.id);

        if (medicine && medicine.retailer.toString() === req.user._id.toString()) {
            medicine.name = name?.trim() || medicine.name;
            medicine.category = category || medicine.category;
            medicine.price = price !== undefined ? price : medicine.price;
            medicine.stock = stock !== undefined ? stock : medicine.stock;
            if (batches !== undefined) medicine.batches = batches;
            medicine.description = description || medicine.description;

            const updatedMedicine = await medicine.save();

            // Trigger notification if stock is restored
            if (updatedMedicine.stock > 0) {
                await notifyCustomersOnRestock(updatedMedicine.name);
            }

            await logActivity(req.user, 'Update stock', `Updated stock for ${updatedMedicine.name} to ${updatedMedicine.stock}`, updatedMedicine._id);

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
        const medName = medicine.name;
        await medicine.deleteOne();
        await logActivity(req.user, 'Delete medicine', `Removed medicine: ${medName}`);
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
        }).populate('retailer', 'name email location');

        console.log(`Found ${medicines.length} matches`);
        await logActivity(req.user, 'Search medicine', `Searched for: "${name}"`);
        res.json(medicines);
    } catch (error) {
        console.error('Search Error:', error);
        res.status(500).json({ message: 'Error searching medicines', error: error.message });
    }
};

const getAlternatives = async (req, res) => {
    try {
        const { category, excludeId } = req.query;
        if (!category) return res.status(400).json({ message: 'Category is required' });

        const alternatives = await Medicine.find({
            category,
            _id: { $ne: excludeId },
            stock: { $gt: 0 }
        }).limit(3);

        res.json(alternatives);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching alternatives' });
    }
};

module.exports = { 
    getMedicines, 
    createMedicine, 
    createBulkMedicines, 
    updateMedicine, 
    deleteMedicine, 
    searchMedicineAvailability,
    getAlternatives
};
