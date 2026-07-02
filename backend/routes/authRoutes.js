// This file orchestrates application pathways bounding completely unrestrained public authentication connections (login/register).
// Import Express to utilize its Routing capabilities
const express = require('express');

// Create a new router instance to separate authentication routes into their own module
const router = express.Router();

// Import the specific controller functions that handle the business logic for these routes
const { register, login } = require('../controllers/authController');

// Map a POST request to '/register' -> This triggers the 'register' function
router.post('/register', register);

// Map a POST request to '/login' -> This triggers the 'login' function
router.post('/login', login);

// Export the router so it can be 'used' within our main server.js application
module.exports = router;
