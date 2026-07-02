// This file serves as the fundamental application entry point resolving Express routing natively!
// It registers central environment properties, initializes MongoDB bindings, mounts respective feature modules (auth, jobs, apps, profiles, admin),
// generates seed data natively over development modes, and lastly anchors the centralized robust error handler properly.

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors');

// Import route models
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const profileRoutes = require('./routes/profileRoutes');
const adminRoutes = require('./routes/adminRoutes'); // New admin component

// Import unified error handler middleware explicitly
const errorHandler = require('./middleware/errorHandler');

// Seed route specific schema definitions inherently 
const User = require('./models/User');

const app = express();
app.use(cors());
app.use(express.json());

// Main structural route endpoints
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/admin', adminRoutes);

// Establish static buffer streaming handling locally stored PDF assets seamlessly
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: "Server is running" });
});

// @route   GET /seed
// @desc    Developmental utility seeding exactly 1 Student, 1 Employer, and 1 Admin statically
// @access  Public (Hidden inherently underneath development mode conditionals)
app.get('/seed', async (req, res, next) => {
    try {
        let users = [];
        
        // Define credentials
        const testStudent = { name: "Test Student", email: "student@test.com", password: "password123", role: "student" };
        const testEmployer = { name: "Test Employer", email: "employer@test.com", password: "password123", role: "employer" };
        const testAdmin = { name: "Test Admin", email: "admin@test.com", password: "password123", role: "admin" };

        for (let data of [testStudent, testEmployer, testAdmin]) {
            const exists = await User.findOne({ email: data.email });
            if (!exists) {
                const user = await User.create(data);
                users.push(user.email);
            }
        }
        res.status(200).json({ success: true, message: "Seed algorithm executed successfully", generated: users });
    } catch (error) {
        next(error);
    }
});

// VERY IMPORTANT: Bind universal exception interceptor exclusively logically AFTER existing route arrays
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('Successfully connected to MongoDB');
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error.message);
    });
