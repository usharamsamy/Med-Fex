const Request = require('../models/Request');
const Prescription = require('../models/Prescription');
const Medicine = require('../models/Medicine');

const createRequest = async (req, res) => {
    const { medicineName, type, prescriptionId } = req.body;
    const request = new Request({
        customer: req.user._id,
        medicineName,
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

const Notification = require('../models/Notification');

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
                const medicine = await Medicine.findOne({
                    name: { $regex: new RegExp(`^${request.medicineName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
                    retailer: req.user._id
                });

                if (medicine) {
                    if (medicine.stock > 0) {
                        medicine.stock -= 1;
                        await medicine.save();
                    } else {
                        return res.status(400).json({ message: 'Cannot complete: Medicine out of stock.' });
                    }
                }
            }

            request.status = status;
            request.retailerMessage = retailerMessage;
            const updatedRequest = await request.save();

            // Notify Customer
            const isReady = status === 'Ready for Pickup';
            const isCompleted = status === 'Completed';

            await Notification.create({
                user: request.customer._id,
                title: isCompleted ? 'Order Completed' : `Order Status: ${status}`,
                message: isCompleted
                    ? `Thank you! Your request for ${request.medicineName} has been marked as collected.`
                    : `Your request for ${request.medicineName} is now ${status.toLowerCase()}.${retailerMessage ? ' Note: ' + retailerMessage : ''}`,
                type: (isReady || isCompleted) ? 'success' : (status === 'Rejected' ? 'danger' : 'info')
            });

            res.json(updatedRequest);
        } else {
            res.status(404).json({ message: 'Request not found' });
        }
    } catch (error) {
        console.error('Error updating request status:', error);
        res.status(500).json({ message: 'Server error while updating request' });
    }
};

module.exports = { createRequest, getCustomerRequests, getRetailerRequests, updateRequestStatus };
