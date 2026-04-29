const Request = require('../models/Request');
const Prescription = require('../models/Prescription');
const Medicine = require('../models/Medicine');
const Notification = require('../models/Notification');
const RestockAlert = require('../models/RestockAlert');
const { logActivity } = require('../services/activityService');

const createRequest = async (req, res) => {
    try {
        // 🛡️ HARD GUARD
        if (!req.body) {
            return res.status(400).json({ message: 'Request body is missing.' });
        }

        const medicineName = req.body.medicineName;
        const type = req.body.type;
        const prescriptionId = req.body.prescriptionId;

        let dosage = req.body.dosage;
        let refillDays = req.body.refillDays;

        if (prescriptionId && (!dosage || !refillDays)) {
            const presc = await Prescription.findById(prescriptionId);
            if (presc) {
                dosage = dosage || presc.dosage;
                refillDays = refillDays || presc.refillDays;
            }
        }

        const calc = calculateRequiredStock(dosage, refillDays);

        const request = new Request({
            customer: req.user._id,
            medicineName: String(medicineName).trim(),
            type,
            prescriptionId,
            dosage,
            refillDays,
            totalTablets: calc.totalTablets,
            requiredStock: calc.requiredStock,
            isEmergency: !!(req.body.isEmergency || req.body.isUrgent)
        });
        const createdRequest = await request.save();

        const retailers = await require('../models/User').find({ role: 'retailer' });
        for (const r of retailers) {
            await Notification.create({
                user: r._id,
                title: createdRequest.isEmergency ? '🚨 EMERGENCY REQUEST' : 'New Customer Request',
                message: `${createdRequest.isEmergency ? 'URGENT: ' : ''}A new request for ${createdRequest.medicineName} has been submitted.`,
                type: createdRequest.isEmergency ? 'danger' : 'info'
            });
        }
        await logActivity(req.user, 'Request Created', `${req.user.name} requested ${createdRequest.medicineName}${createdRequest.isEmergency ? ' (EMERGENCY)' : ''}`);

        res.status(201).json(createdRequest);
    } catch (error) {
        console.error('Create Request Error:', error);
        res.status(500).json({ message: 'Error creating request', error: error.message });
    }
};

const getCustomerRequests = async (req, res) => {
    try {
        const requests = await Request.find({ customer: req.user._id }).sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching customer requests' });
    }
};

const getRetailerRequests = async (req, res) => {
    try {
        let requests = await Request.find({
            $or: [
                { status: 'Pending' },
                { retailer: req.user._id }
            ]
        }).populate('customer', 'name email').lean();

        // Custom Priority Sorting Logic per requirements:
        // Emergency Requests → First
        // Pending Requests → Next
        // Accepted → Next
        // Completed → Last
        const statusPriority = {
            'Pending': 1,
            'Accepted': 2,
            'Ready for Pickup': 3,
            'Completed': 4,
            'Rejected': 5
        };

        requests.sort((a, b) => {
            // First priority: Emergency
            if (a.isEmergency !== b.isEmergency) return b.isEmergency ? -1 : 1;
            
            // Second priority: Status
            const pA = statusPriority[a.status] || 99;
            const pB = statusPriority[b.status] || 99;
            if (pA !== pB) return pA - pB;
            
            // Third priority: Latest first
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching retailer requests' });
    }
};

const updateRequestStatus = async (req, res) => {
    try {
        const { status, retailerMessage, rejectionReason } = req.body;
        const request = await Request.findById(req.params.id).populate('customer');

        if (request) {
            // Lock if already completed
            if (request.status === 'Completed') {
                return res.status(400).json({ message: 'Request is already completed and locked.' });
            }

            // Guard for Acceptance: Ensure stock is sufficient
            if (status === 'Accepted') {
                const cleanName = request.medicineName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const medicine = await Medicine.findOne({
                    name: { $regex: new RegExp(`^${cleanName}$`, 'i') },
                    retailer: req.user._id
                });

                const neededQty = request.requiredStock || 1;
                if (!medicine) {
                    return res.status(404).json({ message: 'Medicine not found in your inventory' });
                }

                if (medicine.stock < neededQty) {
                    return res.status(400).json({
                        message: `Cannot accept: Insufficient stock. Needed: ${neededQty}, Available: ${medicine.stock}`
                    });
                }

                // Check for expiry
                const now = new Date();
                const validBatches = medicine.batches.filter(b => new Date(b.expiryDate) > now && b.stock > 0);
                if (validBatches.length === 0 && medicine.batches.length > 0) {
                     return res.status(400).json({ message: 'Cannot accept: All batches for this medicine have expired.' });
                }

                request.retailer = req.user._id;
            }

            // Deduct stock if marking as Completed
            if (status === 'Completed') {
                const cleanName = request.medicineName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const medicine = await Medicine.findOne({
                    name: { $regex: new RegExp(`^${cleanName}$`, 'i') },
                    retailer: req.user._id
                });

                if (medicine) {
                    // Recalculate using stored dosage/refillDays if available, otherwise use requiredStock
                    const calc = calculateRequiredStock(request.dosage, request.refillDays);
                    const deductionQty = calc.requiredStock || request.requiredStock || 1;

                    if (medicine.stock >= deductionQty) {
                        medicine.stock -= deductionQty;
                        await medicine.save();
                        console.log(`Auto-deducted ${deductionQty} units for ${medicine.name}`);

                        if (medicine.stock < 10 && medicine.stock + deductionQty >= 10) {
                            await Notification.create({
                                user: req.user._id,
                                title: 'Low Stock Alert',
                                message: `Stock for ${medicine.name} has fallen to ${medicine.stock} units. Restock suggested.`,
                                type: 'danger'
                            });
                        }
                    } else {
                        return res.status(400).json({ message: `Cannot complete: Insufficient stock. Needed: ${deductionQty}, Available: ${medicine.stock}` });
                    }
                }
            }

            request.status = status;
            request.retailerMessage = req.body.retailerMessage || retailerMessage;
            if (status === 'Rejected') {
                request.rejectReason = req.body.rejectReason || 'Other';
                request.pharmacistNote = req.body.pharmacistNote || '';
                
                // NEW: Handle Restock Alert for "Out of stock"
                if (request.rejectReason === 'Out of stock') {
                    await RestockAlert.findOneAndUpdate(
                        { medicineName: request.medicineName.trim(), retailer: req.user._id },
                        { 
                            $inc: { rejectCount: 1 },
                            $set: { lastRequested: new Date(), notified: false }
                        },
                        { upsert: true, new: true }
                    );
                }
            }
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

            // Log the activity
            let activityTitle = `Order ${status}`;
            if (status === 'Accepted') activityTitle = 'Request Accepted';
            if (status === 'Rejected') activityTitle = 'Request Rejected';
            if (status === 'Ready for Pickup') activityTitle = 'Marked as Ready';
            if (status === 'Completed') activityTitle = 'Marked as Collected';

            await logActivity(req.user, activityTitle, `${request.medicineName} request ${status.toLowerCase()} for ${request.customer?.name || 'Customer'}${status === 'Rejected' ? '. Reason: ' + rejectionReason : ''}`);

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
            const calc = calculateRequiredStock(request.dosage, request.refillDays);
            const deductionQty = calc.requiredStock || request.requiredStock || 1;

            if (medicine.stock >= deductionQty) {
                medicine.stock -= deductionQty;
                await medicine.save();
                console.log(`Stock successfully deducted: ${deductionQty} units for ${medicine.name}. Remaining: ${medicine.stock}`);

                if (medicine.stock < 10 && medicine.stock + deductionQty >= 10) {
                    await Notification.create({
                        user: req.user._id,
                        title: 'Low Stock Alert',
                        message: `Stock for ${medicine.name} has fallen to ${medicine.stock} units. Restock suggested.`,
                        type: 'danger'
                    });
                }
            } else {
                return res.status(400).json({ message: `Cannot complete: Insufficient stock for ${medicine.name}. Needed: ${deductionQty}, Available: ${medicine.stock}` });
            }
        } else {
            console.warn(`Medicine "${request.medicineName}" not found for deduction.`);
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

        // Log the activity
        await logActivity(req.user, 'Marked as Collected', `${request.medicineName} order completed and stock updated for ${request.customer?.name || 'Customer'}`);
        await logActivity(request.customer, 'Order Collected', `Collected ${request.medicineName} from pharmacy`);

        res.json(updatedRequest);
    } catch (error) {
        console.error('Complete Request ERROR:', error);
        res.status(500).json({ message: 'Server error while completing request', error: error.message });
    }
};

const reRequest = async (req, res) => {
    try {
        const oldRequest = await Request.findById(req.params.id);

        if (!oldRequest) {
            return res.status(404).json({ message: 'Original request not found' });
        }

        // Validate that this request was indeed notified for restock
        if (!oldRequest.notified || oldRequest.status !== 'Rejected') {
            return res.status(400).json({ message: 'Request is not eligible for re-request' });
        }

        // Check if medicine is in stock
        const cleanName = oldRequest.medicineName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const medicine = await Medicine.findOne({
            name: { $regex: new RegExp(`^${cleanName}$`, 'i') }
        });

        if (!medicine || medicine.stock <= 0) {
            return res.status(400).json({ message: 'Medicine is currently out of stock. Cannot re-request yet.' });
        }

        // Calculate requirements
        let totalTablets = oldRequest.totalTablets || 0;
        let requiredStock = oldRequest.requiredStock || 1;

        if (oldRequest.prescriptionId && (!totalTablets || requiredStock === 1)) {
            const presc = await Prescription.findById(oldRequest.prescriptionId);
            if (presc) {
                const calc = calculateRequiredStock(presc.dosage, presc.refillDays);
                totalTablets = calc.totalTablets;
                requiredStock = calc.requiredStock;
            }
        }

        // Create the new request
        const newRequest = new Request({
            customer: req.user._id,
            medicineName: oldRequest.medicineName,
            type: oldRequest.type,
            prescriptionId: oldRequest.prescriptionId,
            status: 'Pending',
            totalTablets,
            requiredStock
        });

        const createdRequest = await newRequest.save();

        // Mark the old request so the button doesn't show up anymore
        oldRequest.notified = false;
        await oldRequest.save();

        // Notify Customer of the fresh pending request
        await Notification.create({
            user: req.user._id,
            title: 'Re-request Successful',
            message: `Your fresh request for ${newRequest.medicineName} has been submitted and is now pending.`,
            type: 'info'
        });

        await logActivity(req.user, 'Re-request medicine', `Resubmitted request for ${newRequest.medicineName}`);

        res.status(201).json(createdRequest);
    } catch (error) {
        console.error('Re-request Error:', error);
        res.status(500).json({ message: 'Server error while processing re-request', error: error.message });
    }
};

const getRequestById = async (req, res) => {
    try {
        const request = await Request.findById(req.params.id)
            .populate('customer', 'name email phone')
            .populate('prescriptionId');
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Try to find the medicine price as well
        const Medicine = require('../models/Medicine');
        const medicine = await Medicine.findOne({ 
            name: { $regex: new RegExp(`^${request.medicineName}$`, 'i') },
            retailer: req.user._id 
        });

        const requestObj = request.toObject();
        requestObj.medicinePrice = medicine ? medicine.price : 0;
        requestObj.medicineId = medicine ? medicine._id : null;

        res.json(requestObj);
    } catch (error) {
        console.error('Fetch Request Error:', error);
        res.status(500).json({ message: 'Error fetching request details' });
    }
};

const calculateRequiredStock = (dosage, days) => {
    try {
        if (!dosage || !days) return { totalTablets: 0, requiredStock: 1 };

        // Parse dosage (e.g., "1-1-0", "1-0-1", "2-2-2")
        const parts = dosage.split('-').map(p => {
            const num = Number(p.trim());
            return isNaN(num) ? 0 : num;
        });

        const tabletsPerDay = parts.reduce((a, b) => a + b, 0);
        const totalTablets = tabletsPerDay * Number(days);

        // 1 stock unit = 10 tablets, round up
        const requiredStock = Math.ceil(totalTablets / 10) || 1;

        return { totalTablets, requiredStock };
    } catch (err) {
        console.error('Calculation Error:', err);
        return { totalTablets: 0, requiredStock: 1 };
    }
};

const notifyRestockedCustomers = async (req, res) => {
    try {
        // Find all medicines belonging to this retailer
        const medicines = await Medicine.find({ retailer: req.user._id });
        const inStockMeds = medicines.filter(m => m.stock > 0).map(m => m.name.toLowerCase());

        // Find rejected requests for these medicines that haven't been notified yet
        const rejectedRequests = await Request.find({
            status: 'Rejected',
            rejectionReason: 'Out of Stock',
            notified: { $ne: true }
        }).populate('customer');

        let notificationCount = 0;

        for (const request of rejectedRequests) {
            if (inStockMeds.includes(request.medicineName.toLowerCase())) {
                // Send notification
                await Notification.create({
                    user: request.customer._id,
                    title: 'Medicine Back in Stock!',
                    message: `The medicine "${request.medicineName}" you requested is now available. You can re-request it from your dashboard.`,
                    type: 'success'
                });

                // Mark request as notified
                request.notified = true;
                await request.save();
                notificationCount++;
            }
        }

        // Log activity
        await logActivity(req.user, 'Mass Notification', `Notified ${notificationCount} customers about restocked items.`);

        res.json({ message: `Successfully notified ${notificationCount} customers.` });
    } catch (error) {
        console.error('Notify Restock Error:', error);
        res.status(500).json({ message: 'Error sending restock notifications', error: error.message });
    }
};

const logInvoiceDownload = async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);
        if (request) {
            await logActivity(req.user, 'Download invoice', `Downloaded invoice for ${request.medicineName}`);
            res.json({ message: 'Download logged' });
        } else {
            res.status(404).json({ message: 'Request not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error logging download' });
    }
};
const PDFDocument = require('pdfkit');

const downloadInvoice = async (req, res) => {
    try {
        const request = await Request.findById(req.params.id)
            .populate('customer', 'name email phone')
            .populate('retailer', 'name phone');

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        const doc = new PDFDocument({ margin: 50 });
        
        let filename = `MedFex_Invoice_${request._id.toString().substring(0, 8)}.pdf`;
        res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
        res.setHeader('Content-type', 'application/pdf');

        doc.pipe(res);

        // Header
        doc.fontSize(25).fillColor('#10b981').text('MedFex Smart Medical Shop', { align: 'center' });
        doc.fontSize(10).fillColor('#64748b').text('Seamless Healthcare Delivery', { align: 'center' });
        doc.moveDown(1.5);
        
        doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#e2e8f0').stroke();
        doc.moveDown(1);

        const infoTop = doc.y;
        doc.fontSize(11).fillColor('#1e293b');
        
        // Billing Info
        doc.font('Helvetica-Bold').text('Customer Details:', 50, infoTop);
        doc.font('Helvetica').text(`Customer Name: ${request.customer?.name || 'Customer'}`, 50, infoTop + 15);
        doc.text(`Email: ${request.customer?.email || 'N/A'}`, 50, infoTop + 30);
        
        // Order Info
        doc.font('Helvetica-Bold').text('Invoice Info:', 350, infoTop);
        doc.font('Helvetica').text(`Order Date: ${new Date(request.createdAt).toLocaleDateString()}`, 350, infoTop + 15);
        doc.text(`Order ID: #${request._id.toString().toUpperCase().substring(0, 10)}`, 350, infoTop + 30);
        doc.text(`Order Status: ${request.status}`, 350, infoTop + 45);
        
        doc.moveDown(5);

        // Calculation and Order Summary
        let medPrice = 0;
        const cleanName = request.medicineName ? request.medicineName.trim().toLowerCase() : '';
        if (cleanName) {
            const medData = await Medicine.findOne({ name: { $regex: new RegExp(`^${cleanName}$`, 'i') } });
            if (medData) medPrice = medData.price || 0;
        }

        const qty = request.requiredStock || (request.totalTablets ? Math.ceil(request.totalTablets / 10) : 1);
        const finalTotal = medPrice * qty;

        // Table
        const currentY = doc.y;
        doc.font('Helvetica-Bold').fontSize(12).fillColor('#10b981');
        doc.text('Medicine', 50, currentY);
        doc.text('Quantity', 250, currentY, { width: 80, align: 'center' });
        doc.text('Price (Rs.)', 350, currentY, { width: 100, align: 'center' });
        doc.text('Total (Rs.)', 480, currentY, { width: 70, align: 'right' });

        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#10b981').stroke();
        doc.moveDown(1);

        doc.font('Helvetica').fontSize(11).fillColor('#1e293b');
        const itemTop = doc.y;
        doc.text(request.medicineName, 50, itemTop, { width: 190 });
        doc.text(qty.toString(), 250, itemTop, { width: 80, align: 'center' });
        doc.text(`Rs. ${medPrice.toFixed(2)}`, 350, itemTop, { width: 100, align: 'center' });
        doc.text(`Rs. ${finalTotal.toFixed(2)}`, 480, itemTop, { width: 70, align: 'right' });

        doc.moveDown(2.5);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#e2e8f0').stroke();
        doc.moveDown(1.5);

        // Summary totals
        const footerY = doc.y;
        doc.font('Helvetica-Bold').fontSize(14).fillColor('#1e293b');
        doc.text(`Total Amount: Rs. ${finalTotal.toFixed(2)}`, 350, footerY, { align: 'right' });
        
        doc.font('Helvetica').fontSize(10).fillColor('#64748b');
        doc.text(`Payment Type: Online Payment`, 350, footerY + 20, { align: 'right' });
        doc.text(`Retailer: ${request.retailer?.name || 'MedFex Official'}`, 50, footerY);
        
        doc.moveDown(3);
        doc.fontSize(14).fillColor('#10b981').text('Thank you for your purchase', { align: 'center' });
        doc.fontSize(10).fillColor('#94a3b8').text('MedFex - Smart Medical Shop', { align: 'center' });
        
        doc.end();

        await logActivity(req.user, 'Download invoice', `Downloaded backend invoice for ${request.medicineName}`);
    } catch (error) {
        console.error('Invoice Generation Error:', error);
        res.status(500).json({ message: 'Unable to generate invoice. Please try again.' });
    }
};

const getRestockAlerts = async (req, res) => {
    try {
        const alerts = await RestockAlert.find({ 
            retailer: req.user._id, 
            notified: false 
        }).sort({ lastRequested: -1 });

        // Join with medicine to get currentStock
        const alertsWithStock = await Promise.all(alerts.map(async (alert) => {
            const medicine = await Medicine.findOne({
                name: { $regex: new RegExp(`^${alert.medicineName}$`, 'i') },
                retailer: req.user._id
            });
            return {
                ...alert.toObject(),
                currentStock: medicine ? medicine.stock : 0,
                medicineId: medicine ? medicine._id : null
            };
        }));

        res.json(alertsWithStock);
    } catch (error) {
        console.error('Restock Alerts Error:', error);
        res.status(500).json({ message: 'Error fetching restock alerts' });
    }
};

const restockMedicine = async (req, res) => {
    try {
        const { medicineName, quantity } = req.body;
        const qtyToAdd = Number(quantity);
        
        if (isNaN(qtyToAdd) || qtyToAdd <= 0) {
            return res.status(400).json({ message: 'Invalid quantity' });
        }

        // 1. Update or Create Medicine
        let medicine = await Medicine.findOne({
            name: { $regex: new RegExp(`^${medicineName}$`, 'i') },
            retailer: req.user._id
        });

        if (!medicine) {
            // Find a previous request to get some context if possible, or just use defaults
            const sampleRequest = await Request.findOne({ 
                medicineName: { $regex: new RegExp(`^${medicineName}$`, 'i') } 
            });

            medicine = new Medicine({
                name: medicineName,
                retailer: req.user._id,
                stock: qtyToAdd,
                price: 10, // Default price as requested
                category: sampleRequest?.type || 'Tablet', // Try to get type from request
                description: 'Automatically added during restock'
            });
        } else {
            medicine.stock += qtyToAdd;
        }
        
        await medicine.save();

        // 2. Mark Restock Alert as Notified/Done
        await RestockAlert.findOneAndDelete({
            medicineName: { $regex: new RegExp(`^${medicineName}$`, 'i') },
            retailer: req.user._id
        });

        // 3. Find all customers with rejected requests for this medicine and notify them
        const rejectedRequests = await Request.find({
            medicineName: { $regex: new RegExp(`^${medicineName}$`, 'i') },
            status: 'Rejected',
            rejectReason: 'Out of stock',
            notified: { $ne: true }
        }).populate('customer');

        let notifiedCount = 0;
        for (const request of rejectedRequests) {
            if (request.customer) {
                await Notification.create({
                    user: request.customer._id,
                    title: 'Medicine Back in Stock!',
                    message: `The medicine ${medicineName} is now back in stock. You can place your request again.`,
                    type: 'success'
                });
                
                // Mark request so we don't notify multiple times
                request.notified = true;
                await request.save();
                notifiedCount++;
            }
        }

        await logActivity(req.user, 'Inventory Restocked', `Restocked ${qtyToAdd} units of ${medicineName}. Notified ${notifiedCount} customers.`);

        res.json({ 
            message: `Stock updated. ${notifiedCount} customers notified.`,
            newStock: medicine.stock
        });
    } catch (error) {
        console.error('Restock Medicine ERROR:', error);
        res.status(500).json({ message: 'Server error while restocking medicine' });
    }
};

module.exports = { 
    createRequest, 
    getCustomerRequests, 
    getRetailerRequests, 
    updateRequestStatus, 
    completeRequest, 
    reRequest, 
    calculateRequiredStock, 
    notifyRestockedCustomers, 
    getRequestById, 
    logInvoiceDownload, 
    downloadInvoice,
    getRestockAlerts,
    restockMedicine
};
