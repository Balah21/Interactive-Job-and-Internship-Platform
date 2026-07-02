// This file safely bounds Express execution logic funneling incoming PDF buffers and nested JSON strings natively targeting overarching user accounts.
const express = require('express');
const router = express.Router();

const {
    getMyProfile,
    createOrUpdateProfile,
    uploadResume
} = require('../controllers/profileController');

const { protect } = require('../middleware/authMiddleware');
// Source our strictly customized filter parameters resolving uploads!
const upload = require('../middleware/upload');

// Both identities (Student / Employer) naturally harbor capabilities maintaining distinct profiles
router.get('/my', protect, getMyProfile);
router.post('/my', protect, createOrUpdateProfile);

// Specific Resume operation mapping Multer's single intercept command explicitly processing `resume` labeled form blocks internally
router.post('/resume', protect, upload.single('resume'), uploadResume);

module.exports = router;
