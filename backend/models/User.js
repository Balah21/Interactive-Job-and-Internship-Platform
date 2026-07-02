// This file governs the fundamental User identity entity, bridging MongoDB schema validation algorithms and executing automated password hashing natively.
// Import mongoose to define our database schema and model
const mongoose = require('mongoose');
// Import bcryptjs for hashing user passwords securely.
// Hashing is critical because if the database is ever compromised, the attackers 
// won't see the plain-text passwords, protecting users from credential stuffing.
const bcrypt = require('bcryptjs');

// Define the User schema structure with necessary fields and validations
const userSchema = new mongoose.Schema({
    // User's name, marked as required
    name: {
        type: String,
        required: [true, 'Please provide a name']
    },
    // User's email, marked as required and unique to prevent duplicate accounts
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email'
        ]
    },
    // User's password, required and minimum length 6 characters.
    // select: false means by default the password will not be included when we fetch a user.
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false 
    },
    // User role determines their permissions in the system.
    role: {
        type: String,
        enum: ['student', 'employer', 'admin'],
        default: 'student'
    },
    // Track when the account was created
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// A mongoose 'pre' save middleware (hook) that runs before the document is saved to the DB
userSchema.pre('save', async function(next) {
    // If the password field hasn't been changed (e.g. they only changed their name), skip hashing
    if (!this.isModified('password')) {
        next();
    }

    // Generate a secure "salt". A salt is random data that is used as an additional input 
    // to a one-way function that hashes data, defending against dictionary attacks.
    const salt = await bcrypt.genSalt(10);
    // Hash the plain-text password using the generated salt and overwrite the original field
    this.password = await bcrypt.hash(this.password, salt);
});

// An instance method to verify if a provided plain-text password matches the database's hashed password
userSchema.methods.matchPassword = async function(enteredPassword) {
    // bcrypt.compare safely evaluates the hash against the entered string
    return await bcrypt.compare(enteredPassword, this.password);
};

// Compile and export the User model
module.exports = mongoose.model('User', userSchema);
