const Prescription = require('../models/Prescription');
const Notification = require('../models/Notification');

const addPrescription = async (req, res) => {
    try {
        // Log the request for debugging
        console.log('--- DEFINITIVE PRESCRIPTION REQUEST ---');
        console.log('Headers:', req.headers['content-type']);
        console.log('Body:', JSON.stringify(req.body));
        console.log('File:', req.file ? req.file.filename : 'No file');

        // 🛡️ HARD GUARD
        if (!req.body) {
            return res.status(400).json({ message: 'CRITICAL ERROR: Request body is undefined. Check Multer configuration.' });
        }

        // FAIL-SAFE ACCESS - ABSOLUTELY NO DESTRUCTURING
        const medicineName = req.body.medicineName;
        const dosage = req.body.dosage;
        const refillDays = req.body.refillDays || req.body.refillDuration;
        const startDate = req.body.startDate;

        // Manual Validation
        if (!medicineName || !dosage || !refillDays) {
            console.error('Validation Error: Missing fields in body', req.body);
            return res.status(400).json({
                message: 'Medicine name, dosage, and refill days are required.',
                received: { medicineName, dosage, refillDays }
            });
        }

        const prescriptionImg = req.file ? `/uploads/${req.file.filename}` : null;

        const prescription = new Prescription({
            customer: req.user._id,
            medicineName: String(medicineName).trim(),
            dosage: String(dosage),
            refillDays: Number(refillDays),
            startDate: startDate || Date.now(),
            prescriptionImage: prescriptionImg
        });

        console.log('Attempting to save prescription:', prescription);
        const createdPrescription = await prescription.save();
        console.log('Prescription saved successfully');

        // Notify user
        if (req.user) {
            await Notification.create({
                user: req.user._id,
                title: 'New Prescription Added',
                message: `Your prescription for ${medicineName} has been saved. Reminders will be set for every ${refillDays} days.`,
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
