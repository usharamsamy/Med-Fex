const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const initRefillCron = require('./jobs/refillCron');

dotenv.config();

connectDB();
initRefillCron();

const app = express();
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Created uploads directory');
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/medicines', require('./routes/medicineRoutes'));
app.use('/api/requests', require('./routes/requestRoutes'));
app.use('/api/prescriptions', require('./routes/prescriptionRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/suggestions', require('./routes/suggestionRoutes'));

// Global error handler for multer
app.use((err, req, res, next) => {
    if (err instanceof require('multer').MulterError) {
        return res.status(400).json({ message: 'File upload error', error: err.message });
    } else if (err) {
        return res.status(500).json({ message: err.message || 'Internal server error' });
    }
    next();
});

app.get('/', (req, res) => {
    res.send('MedFex API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
