const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { logActivity } = require('../services/activityService');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const registerUser = async (req, res) => {
    const { name, email, password, role } = req.body;
    const userExists = await User.findOne({ email });

    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({ name, email, password, role });

    if (user) {
        await logActivity(user, 'User Registered', `Account created with role: ${user.role}`);
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

const loginUser = async (req, res) => {
    const { email, password, role } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        // Validate if selected role matches database role
        if (role && user.role !== role) {
            const roleName = user.role.charAt(0).toUpperCase() + user.role.slice(1);
            return res.status(401).json({ 
                message: `You are registered as a ${roleName}. Please login from ${roleName} portal.`,
                actualRole: user.role
            });
        }

        await logActivity(user, 'User Login', `Logged into the system as ${user.role}`);
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};

const getUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);
    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            allergies: user.allergies,
            chronicConditions: user.chronicConditions,
            location: user.location
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

const updateUserProfile = async (req, res) => {
    try {
        console.log('MedFex Debug: Update Profile Request Body:', req.body);
        
        // Use userId from body as per user requirements checklist OR from authenticated token
        const lookupId = req.body.userId || req.body.id || req.user._id;
        
        const user = await User.findById(lookupId);
        if (user) {
            // Mapping fields explicitly per requirements
            user.name = req.body.name || user.name;
            user.phone = req.body.phone || user.phone;
            user.location = req.body.location || user.location;
            
            // Supporting allergies and chronic conditions if they are present
            if (req.body.allergies !== undefined) {
                user.allergies = Array.isArray(req.body.allergies) 
                    ? req.body.allergies 
                    : req.body.allergies.toString().split(',').map(s => s.trim()).filter(Boolean);
            }
            if (req.body.chronicConditions !== undefined) {
                user.chronicConditions = Array.isArray(req.body.chronicConditions) 
                    ? req.body.chronicConditions 
                    : req.body.chronicConditions.toString().split(',').map(s => s.trim()).filter(Boolean);
            }

            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();
            console.log('MedFex Debug: User updated successfully:', updatedUser._id);
            
            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                phone: updatedUser.phone,
                location: updatedUser.location,
                allergies: updatedUser.allergies,
                chronicConditions: updatedUser.chronicConditions,
                token: generateToken(updatedUser._id),
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        console.error('CRITICAL: Profile Update Error:', err);
        res.status(500).json({ 
            message: 'Unable to update profile. Please try again.', 
            error: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
};

module.exports = { registerUser, loginUser, getUserProfile, updateUserProfile };
