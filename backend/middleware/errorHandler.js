// This file serves as the unified global exception handling middleware.
// Its core responsibility is catching any unhandled runtime exceptions or intentionally forwarded errors via `next(error)`
// and formatting them consistently before streaming back to the client, preventing Node closures.

const errorHandler = (err, req, res, next) => {
    // Log the error natively internally bridging console debugging
    console.error(err.stack);

    // Retrieve preset status code or default generically natively to 500 Internal Error
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    // Send uniform formatted error packets universally
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Server Error',
        // Optional tracking: Output stack trace safely only inside development mode natively 
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
};

module.exports = errorHandler;
