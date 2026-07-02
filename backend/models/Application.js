// This file fundamentally creates linking bridges bounding distinct Job identifiers physically toward singular Student profiles resolving applications seamlessly.
// Bring in mongoose to define DB properties
const mongoose = require('mongoose');

// Define Schema for Job Applications linking applicant and the job
const applicationSchema = new mongoose.Schema({
    // Store reference to the target job being applied for
    job: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: [true, 'Application must be linked to a target job']
    },
    // Store reference to the applying student
    applicant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Application must contain applicant reference']
    },
    // Optional standard text components
    coverLetter: {
        type: String
    },
    resumeUrl: {
        type: String
    },
    // Track where in the company pipeline the application is residing
    status: {
        type: String,
        enum: ['applied', 'reviewed', 'shortlisted', 'rejected'],
        default: 'applied' // Every new application defaults to applied seamlessly
    },
    // Execution tracker 
    appliedAt: {
        type: Date,
        default: Date.now
    }
});

// VERY IMPORTANT BUSINESS RULE ENFORCEMENT:
// This compound unique index explicitly prevents the same user from submitting more than one entry against a singular job posting in MongoDB native operations.
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

// Compile schema into model and export
module.exports = mongoose.model('Application', applicationSchema);
