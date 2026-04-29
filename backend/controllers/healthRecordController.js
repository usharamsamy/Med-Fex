const HealthRecord = require('../models/HealthRecord');

const getHealthRecords = async (req, res) => {
    try {
        const records = await HealthRecord.find({ customer: req.user._id }).sort({ date: -1 });
        res.json(records);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching health records' });
    }
};

const addHealthRecord = async (req, res) => {
    try {
        const { type, value, metric, notes, date } = req.body;
        const record = new HealthRecord({
            customer: req.user._id,
            type,
            value,
            metric,
            notes,
            date: date || Date.now()
        });
        const savedRecord = await record.save();
        res.status(201).json(savedRecord);
    } catch (error) {
        res.status(500).json({ message: 'Error adding health record' });
    }
};

const deleteHealthRecord = async (req, res) => {
    try {
        const record = await HealthRecord.findById(req.params.id);
        if (record && record.customer.toString() === req.user._id.toString()) {
            await record.deleteOne();
            res.json({ message: 'Record removed' });
        } else {
            res.status(404).json({ message: 'Record not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error deleting record' });
    }
};

module.exports = { getHealthRecords, addHealthRecord, deleteHealthRecord };
