// This file functions natively serving defensive middleware logic strictly intercepting execution pathways validating embedded JWT configurations securely.
// Import jsonwebtoken to parse and verify the tokens issued during login/register
const jwt = require('jsonwebtoken');

// Import User model to retrieve user details from the authorized token
const User = require('../models/User');

// Middleware: 'protect'
// This middleware runs BEFORE protected routes to verify the user is logged in
exports.protect = async (req, res, next) => {
    let token;

    // Check if the request contains an "Authorization" header and whether it starts with "Bearer"
    // (A convention for sending tokens in HTTP headers -> "Authorization: Bearer <token>")
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Split the string by space and grab the second part which is the actual token
            token = req.headers.authorization.split(' ')[1];

            // Verify the token using our secret key. 
            // This accurately decodes the payload, yielding an object like { id: '...', iat: ..., exp: ... }
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Fetch the user identified by the decoded ID and attach it to the `req` object 
            // We exclude the password using .select('-password') since we don't want to expose it in memory here
            req.user = await User.findById(decoded.id).select('-password');

            // Verification successful! Move to the next middleware or route handler using next()
            next();
        } catch (error) {
            console.error(error);
            // If the token is invalid, tampered with, or expired, reject the request
            res.status(401).json({ message: 'Not authorized, invalid or expired token' });
        }
    }

    // If the Authorization header was missing completely
    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token provided' });
    }
};

// Middleware: 'authorize'
// This middleware runs AFTER 'protect' to restrict access to specific roles (e.g. "admin", "employer")
// We use the rest operator '...roles' so we can pass multiple roles like: authorize('admin', 'employer')
exports.authorize = (...roles) => {
    return (req, res, next) => {
        // req.user was previously set by the 'protect' middleware.
        // We simply check if their role is present in our allowed roles array.
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `User role '${req.user.role}' is strongly forbidden from accessing this route`
            });
        }
        // User has the correct role, allow them through
        next();
    };
};
