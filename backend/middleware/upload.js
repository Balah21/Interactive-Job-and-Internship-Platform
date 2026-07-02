// This file statically establishes pipeline restrictions leveraging Multer inherently resolving physical document payload transfers efficiently against malicious structures.
const multer = require('multer');
const path = require('path');

// Design the storage framework manually instructing multer where to allocate filesystem boundaries locally
const storage = multer.diskStorage({
    destination(req, file, cb) {
        // Establish 'uploads/' folder target locally at root of the executed backend tree
        cb(null, 'uploads/');
    },
    filename(req, file, cb) {
        // Appending unique timestamps avoids overlap namespace collision between identically named files (e.g., 'resume.pdf')
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

// Defensive procedural filter limiting binary transmission strictly avoiding payload attacks
function checkFileType(file, cb) {
    // Specifically searching strictly toward identical PDF signatures
    const filetypes = /pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    // Provide affirmative response
    if (extname && mimetype) {
        return cb(null, true);
    } else {
        // Output deliberate rejection error
        cb(new Error('Invalid File Format! Strictly limit to PDF constraints'));
    }
}

// Assemble upload middleware implementation!
// Usage of Multer fundamentally acts parsing complicated 'multipart/form-data' data packets allowing Node processing
const upload = multer({
    storage,
    limits: { fileSize: 5000000 }, // Establish 5MB memory choke resolving buffer overflow vulnerability checks
    fileFilter: function(req, file, cb) {
        checkFileType(file, cb);
    }
});

module.exports = upload;
