// This file determines Express routing logic forwarding /api/admin endpoints strictly towards the localized components inside adminController.
// Every native endpoint explicitly forces authorization isolating operations inherently behind Admin boundaries exclusively.

const express = require('express');
const router = express.Router();

const {
    getAllUsers,
    deleteUser,
    getPendingJobs,
    approveOrRejectJob,
    getDashboardStats
} = require('../controllers/adminController');

const { protect, authorize } = require('../middleware/authMiddleware');

// Employ middleware universally against all local endpoints implicitly saving redundant declarations globally.
router.use(protect);
router.use(authorize('admin'));

// Map structural routing points respectively 
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);

router.get('/jobs/pending', getPendingJobs);
router.put('/jobs/:id/status', approveOrRejectJob);

router.get('/stats', getDashboardStats);

module.exports = router;
