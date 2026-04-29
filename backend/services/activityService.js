const ActivityLog = require('../models/ActivityLog');

const logActivity = async (user, action, details = '', relatedId = null) => {
    try {
        if (!user) return;
        
        await ActivityLog.create({
            user: user._id,
            userName: user.name,
            userRole: user.role,
            action,
            details,
            relatedId
        });
    } catch (error) {
        console.error('Activity Log Error:', error);
    }
};

module.exports = { logActivity };
