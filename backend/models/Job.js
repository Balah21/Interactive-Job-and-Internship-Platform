// This file structurally outlines Job postings locally establishing data arrays bounding employers, required skills, and approval limits intrinsically.
// Import mongoose to describe our object relations in MongoDB
const mongoose = require('mongoose');

// Define the blueprint for Job entities within the MongoDB collection
const jobSchema = new mongoose.Schema({
    // Standard string fields with required validations
    title: { type: String, required: [true, 'Please add a job title'] },
    company: { type: String, required: [true, 'Please add a company name'] },
    description: { type: String, required: [true, 'Please add a job description'] },
    location: { type: String },
    
    // Enum to restrict types to expected formats
    type: {
        type: String,
        enum: ['full-time', 'part-time', 'internship'],
        required: [true, 'Please specify the job type']
    },
    
    salary: { type: String }, // Optional field
    skills: { type: [String] }, // Optional array of skills
    
    // Relational property linking the job positing to an Employer user
    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Administrative property indicating the publication state of the job post
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending' // Jobs require manual verification initially
    },
    
    deadline: { type: Date }, // Optional submission deadline date
    createdAt: { type: Date, default: Date.now } // In-built tracking creation date
});

// Compile the schema into a Mongoose model
module.exports = mongoose.model('Job', jobSchema);
