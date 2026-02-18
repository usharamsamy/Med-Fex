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

const updateRequestStatus = async (req, res) => {
    const { status, retailerMessage } = req.body;
    const request = await Request.findById(req.params.id);

    if (request) {
        request.status = status;
        request.retailerMessage = retailerMessage;
        const updatedRequest = await request.save();
        res.json(updatedRequest);
    } else {
        res.status(404).json({ message: 'Request not found' });
    }
};

module.exports = { createRequest, getCustomerRequests, getRetailerRequests, updateRequestStatus };
