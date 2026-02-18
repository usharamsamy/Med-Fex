const Prescription = require('../models/Prescription');
const Notification = require('../models/Notification');

const addPrescription = async (req, res) => {
    try {
        const { medicineName, dosage, refillDuration, startDate } = req.body;

        if (!medicineName || !dosage || !refillDuration) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const prescription = new Prescription({
            customer: req.user._id,
            medicineName,
            dosage,
            refillDuration,
            startDate: startDate || Date.now(),
            prescriptionImage: req.file ? `/uploads/${req.file.filename}` : null
        });

        console.log('Attempting to save prescription:', prescription);
        const createdPrescription = await prescription.save();
        console.log('Prescription saved successfully');

        // Notify user
        if (req.user) {
            await Notification.create({
                user: req.user._id,
                title: 'New Prescription Added',
                message: `Your prescription for ${medicineName} has been saved. Reminders will be set for every ${refillDuration} days.`,
                type: 'success'
            });
        }

        res.status(201).json(createdPrescription);
    } catch (error) {
        console.error('Add Prescription ERROR DETAILS:', {
            message: error.message,
            stack: error.stack,
            body: req.body,
            file: req.file
        });

        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation Error', errors: error.errors });
        }

        res.status(500).json({ message: 'Server error adding prescription', error: error.message });
    }
};

const getMyPrescriptions = async (req, res) => {
    const prescriptions = await Prescription.find({ customer: req.user._id }).sort({ nextRefillDate: 1 });
    res.json(prescriptions);
};

const deletePrescription = async (req, res) => {
    const prescription = await Prescription.findById(req.params.id);
    if (prescription && prescription.customer.toString() === req.user._id.toString()) {
        await prescription.deleteOne();
        res.json({ message: 'Prescription removed' });
    } else {
        res.status(404).json({ message: 'Prescription not found' });
    }
};

module.exports = { addPrescription, getMyPrescriptions, deletePrescription };
