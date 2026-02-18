const Request = require('../models/Request');
const Prescription = require('../models/Prescription');

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
            request.status = status;
            request.retailerMessage = retailerMessage;
            const updatedRequest = await request.save();

            // Notify Customer
            const isReady = status === 'Ready for Pickup';
            await Notification.create({
                user: request.customer._id,
                title: `Order Status: ${status}`,
                message: `Your request for ${request.medicineName} is now ${status.toLowerCase()}.${retailerMessage ? ' Note: ' + retailerMessage : ''}`,
                type: isReady ? 'success' : (status === 'Rejected' ? 'danger' : 'info')
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
