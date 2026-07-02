// This file organizes target execution pathways mapping HTTP operations strictly towards distinct employer generation functions and generic job querying natively.
const express = require('express');
const router = express.Router();

// Import every defined action available for Jobs
const {
    createJob,
    getAllJobs,
    getJobById,
    updateJob,
    deleteJob,
    approveJob
} = require('../controllers/jobController');

// Import authentication constraints
const { protect, authorize } = require('../middleware/authMiddleware');


// -------------------------------------------------------------------------
// Section: PUBLIC ACCESSIBLE ROUTES
// Why accessible: Guests checking job availability without prior logins
// -------------------------------------------------------------------------

// Access: Public -> Filter outputs approved listings in the database
router.get('/', getAllJobs);
// Access: Public -> Allows detail-view pages on front end applications
router.get('/:id', getJobById);


// -------------------------------------------------------------------------
// Section: EMPLOYER RESTRICTED ROUTES
// Why restricted: Avoids regular students generating fake job publications
// -------------------------------------------------------------------------

// Access: Private -> Verified User required via 'protect' AND must hold 'employer' classification.
router.post('/', protect, authorize('employer'), createJob);
// Access: Private -> Verified 'employer' needed (the modification ownership logic is handled strictly over inside the controller check)
router.put('/:id', protect, authorize('employer'), updateJob);


// -------------------------------------------------------------------------
// Section: MIXED TIE ROUTES (ADMIN OR EMPLOYER)
// Why mix: A user retains deletion abilities to their posts, however Admin has umbrella deletion rights.
// -------------------------------------------------------------------------

// Access: Private -> Authorized for array tuple of role values ('employer', 'admin')
router.delete('/:id', protect, authorize('employer', 'admin'), deleteJob);


// -------------------------------------------------------------------------
// Section: ADMIN-ONLY PROCEDURAL ROUTES
// Why admin: Final authority oversight resolving the jobs `status` queue workflow
// -------------------------------------------------------------------------

// Access: Private -> Hard enforcement against anyone not directly classified "admin"
router.put('/:id/approve', protect, authorize('admin'), approveJob);

module.exports = router;
