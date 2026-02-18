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
const uploadDir = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Created uploads directory at:', uploadDir);
}

app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    if (req.method !== 'GET') console.log('Body:', JSON.stringify(req.body));
    next();
});
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadDir));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/medicines', require('./routes/medicineRoutes'));
app.use('/api/requests', require('./routes/requestRoutes'));
app.use('/api/prescriptions', require('./routes/prescriptionRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/suggestions', require('./routes/suggestionRoutes'));

// Global error handler for multer
app.use((err, req, res, next) => {
    console.error('GLOBAL ERROR:', err);
    if (err instanceof require('multer').MulterError) {
        return res.status(400).json({ message: `File upload error: ${err.message}`, code: err.code });
    } else if (err) {
        return res.status(500).json({
            message: err.message || 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? err : {}
        });
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
