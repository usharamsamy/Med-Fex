const Request = require('../models/Request');
const Prescription = require('../models/Prescription');
const Medicine = require('../models/Medicine');
const Notification = require('../models/Notification');

const createRequest = async (req, res) => {
    const { medicineName, type, prescriptionId } = req.body;
    const request = new Request({
        customer: req.user._id,
        medicineName: medicineName.trim(),
        type,
        prescriptionId
    });
    const createdRequest = await request.save();
    res.status(201).json(createdRequest);
};

const getCustomerRequests = async (req, res) => {
    const requests = await Request.find({ customer: req.user._id }).sort({ createdAt: -1 });
    res.json(requests);
};

const getRetailerRequests = async (req, res) => {
    // In a real app, retailers would only see requests for their shop. 
    // For this simplified version, retailers see all requests they can fulfill.
    const requests = await Request.find().populate('customer', 'name email').sort({ createdAt: -1 });
    res.json(requests);
};

const updateRequestStatus = async (req, res) => {
    try {
        const { status, retailerMessage } = req.body;
        const request = await Request.findById(req.params.id).populate('customer');

        if (request) {
            // Lock if already completed
            if (request.status === 'Completed') {
                return res.status(400).json({ message: 'Request is already completed and locked.' });
            }

            // Deduct stock if marking as Completed
            if (status === 'Completed') {
                const cleanName = request.medicineName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const medicine = await Medicine.findOne({
                    name: { $regex: new RegExp(`^${cleanName}$`, 'i') },
                    retailer: req.user._id
                });

                if (medicine) {
                    if (medicine.stock > 0) {
                        medicine.stock -= 1;
                        await medicine.save();
                    } else {
                        return res.status(400).json({ message: 'Cannot complete: Medicine out of stock.' });
                    }
                } else {
                    console.warn(`Medicine "${request.medicineName}" not found in your inventory for deduction.`);
                    // We still allow completion even if stock deduction fails (optional requirement logic)
                }
            }

            request.status = status;
            request.retailerMessage = retailerMessage;
            const updatedRequest = await request.save();

            // Notify Customer
            const isReady = status === 'Ready for Pickup';
            const isCompleted = status === 'Completed';

            if (request.customer) {
                await Notification.create({
                    user: request.customer._id,
                    title: isCompleted ? 'Order Completed' : `Order Status: ${status}`,
                    message: isCompleted
                        ? `Thank you! Your request for ${request.medicineName} has been marked as collected.`
                        : `Your request for ${request.medicineName} is now ${status.toLowerCase()}.${retailerMessage ? ' Note: ' + retailerMessage : ''}`,
                    type: (isReady || isCompleted) ? 'success' : (status === 'Rejected' ? 'danger' : 'info')
                });
            } else {
                console.warn('Customer not found for request, skipping notification');
            }

            res.json(updatedRequest);
        } else {
            res.status(404).json({ message: 'Request not found' });
        }
    } catch (error) {
        console.error('Update Request Status ERROR DETAILS:', {
            message: error.message,
            stack: error.stack,
            params: req.params,
            body: req.body
        });

        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation Error', errors: error.errors });
        }

        res.status(500).json({ message: 'Server error while updating request' });
    }
};

const completeRequest = async (req, res) => {
    try {
        const { retailerMessage } = req.body;
        const request = await Request.findById(req.params.id).populate('customer');

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Strict transition check
        if (request.status !== 'Ready for Pickup') {
            return res.status(400).json({
                message: `Transition not allowed. Current status: ${request.status}. Only 'Ready for Pickup' requests can be marked as collected.`
            });
        }

        // Deduct stock
        const cleanName = request.medicineName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Try exact match first, then fallback to partial
        let medicine = await Medicine.findOne({
            name: { $regex: new RegExp(`^${cleanName}$`, 'i') },
            retailer: req.user._id
        });

        if (!medicine) {
            medicine = await Medicine.findOne({
                name: { $regex: new RegExp(`${cleanName}`, 'i') },
                retailer: req.user._id
            });
        }

        if (medicine) {
            if (medicine.stock > 0) {
                medicine.stock -= 1;
                await medicine.save();
                console.log(`Stock deducted for ${medicine.name}. New stock: ${medicine.stock}`);
            } else {
                return res.status(400).json({ message: `Cannot complete: ${medicine.name} is out of stock.` });
            }
        } else {
            console.warn(`Medicine "${request.medicineName}" not found in your inventory for deduction.`);
        }

        // Update status
        request.status = 'Completed';
        if (retailerMessage) request.retailerMessage = retailerMessage;
        const updatedRequest = await request.save();

        // Notify Customer
        if (request.customer) {
            await Notification.create({
                user: request.customer._id,
                title: 'Order Completed',
                message: `Thank you! Your request for ${request.medicineName} has been marked as collected.`,
                type: 'success'
            });
        }

        res.json(updatedRequest);
    } catch (error) {
        console.error('Complete Request ERROR:', error);
        res.status(500).json({ message: 'Server error while completing request', error: error.message });
    }
};

module.exports = { createRequest, getCustomerRequests, getRetailerRequests, updateRequestStatus, completeRequest };
