// This file abstracts explicit descriptive structural metadata bounding arrays targeting education and resume strings dynamically beyond base User login objects.
const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    // Hard reference strictly tethered to individual registered User documents (1:1 relation mapping)
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    // Optional self-summary string
    bio: { type: String },
    // Pluralized tagging capabilities
    skills: { type: [String] },
    // Complex array arrays defining structured schooling data
    education: [
        {
            institution: { type: String },
            degree: { type: String },
            year: { type: String }
        }
    ],
    // Similar structural array mapping past positions
    experience: [
        {
            company: { type: String },
            role: { type: String },
            duration: { type: String } 
        }
    ],
    // Points identically mapped towards static PDF assets hosted internally directly inside `backend/uploads` 
    resumeUrl: { type: String },
    linkedIn: { type: String },
    github: { type: String }
});

module.exports = mongoose.model('Profile', profileSchema);
