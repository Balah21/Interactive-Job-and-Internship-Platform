// This file administrates platform moderation natively restricting all actions implicitly to Administrator roles.
// Functions allow deleting generic users, retrieving analytical tracking statistics, and managing Job approval arrays natively.

const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');

// @desc    Get all registered users globally
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find({});
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete any target user by raw Mongo ID
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            res.status(404);
            return next(new Error('Target user natively not located'));
        }

        await user.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all jobs globally residing natively in 'pending' validation status 
// @route   GET /api/admin/jobs/pending
// @access  Private/Admin
exports.getPendingJobs = async (req, res, next) => {
    try {
        const jobs = await Job.find({ status: 'pending' }).populate('postedBy', 'name email');
        res.status(200).json({ success: true, count: jobs.length, data: jobs });
    } catch (error) {
        next(error);
    }
};

// @desc    Modify job array strings determining approval state natively (approve/reject)
// @route   PUT /api/admin/jobs/:id/status
// @access  Private/Admin
exports.approveOrRejectJob = async (req, res, next) => {
    try {
        const { status } = req.body;
        
        if (!['approved', 'rejected'].includes(status)) {
            res.status(400);
            return next(new Error('Submission exclusively processes "approved" or "rejected" target properties'));
        }

        const job = await Job.findByIdAndUpdate(
            req.params.id, 
            { status }, 
            { new: true, runValidators: true }
        );

        if (!job) {
            res.status(404);
            return next(new Error('Job document permanently missing or removed natively'));
        }

        res.status(200).json({ success: true, data: job });
    } catch (error) {
        next(error);
    }
};

// @desc    Export dynamic statistical groupings natively targeting dashboard visualizations
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res, next) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalJobs = await Job.countDocuments();
        const totalApplications = await Application.countDocuments();
        const pendingApprovals = await Job.countDocuments({ status: 'pending' });

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalJobs,
                totalApplications,
                pendingApprovals
            }
        });
    } catch (error) {
        next(error);
    }
};
