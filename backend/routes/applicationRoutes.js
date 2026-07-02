// This file dynamically connects HTTP endpoints restricting access via authentication roles routing Students toward creation & Employers toward statistical review.
const express = require('express');
const router = express.Router();

const {
    applyToJob,
    getMyApplications,
    getJobApplications,
    updateApplicationStatus,
    withdrawApplication
} = require('../controllers/applicationController');

// Retrieve auth logic components enforcing bounds
const { protect, authorize } = require('../middleware/authMiddleware');

// -------------------------------------------------------------------
// SECTION: STUDENT DOMAIN
// Why: Operations targeting the submission side exclusively for candidates.
// -------------------------------------------------------------------

// POST /api/applications/:jobId -> Target logic creates an Application connection specifically. 
// Requires Student distinction over overarching general auth.
router.post('/:jobId', protect, authorize('student'), applyToJob);

// GET /api/applications/my -> Generates dynamic dashboards based internally upon user IDs.
// Must protect Student resources.
router.get('/my', protect, authorize('student'), getMyApplications);

// DELETE /api/applications/:id/withdraw -> Destructive operation isolated locally to Application Authors.
router.delete('/:id/withdraw', protect, authorize('student'), withdrawApplication);

// -------------------------------------------------------------------
// SECTION: EMPLOYER DOMAIN
// Why: Managing endpoints focusing upon review manipulation pipelines
// -------------------------------------------------------------------

// GET /api/applications/job/:jobId -> Analytics delivery yielding comprehensive arrays displaying everyone utilizing that exact JobID entry
// Secure routing isolating bounds completely onto Employer role parameters 
router.get('/job/:jobId', protect, authorize('employer'), getJobApplications);

// PUT /api/applications/:id/status -> Status flow mutation handling
// Protects internal status pipelines ensuring only authorized review boards process strings
router.put('/:id/status', protect, authorize('employer'), updateApplicationStatus);

module.exports = router;
