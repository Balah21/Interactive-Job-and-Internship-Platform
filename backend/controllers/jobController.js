// This file dictates core procedural routing capabilities resolving Job entities explicitly. 
// It guarantees structural constraints validating Employer scopes ensuring active ownership and moderation compliance inherently.

const Job = require('../models/Job');

exports.createJob = async (req, res, next) => {
    try {
        req.body.postedBy = req.user._id;
        const job = await Job.create(req.body);
        res.status(201).json({ success: true, data: job });
    } catch (error) {
        res.status(400);
        next(error);
    }
};

exports.getAllJobs = async (req, res, next) => {
    try {
        let queryOptions = { status: 'approved' };
        
        const { title, location, type } = req.query;

        if (title) queryOptions.title = { $regex: title, $options: 'i' };
        if (location) queryOptions.location = { $regex: location, $options: 'i' };
        if (type) queryOptions.type = type;

        const jobs = await Job.find(queryOptions).populate('postedBy', 'name email');
        res.status(200).json({ success: true, count: jobs.length, data: jobs });
    } catch (error) {
        next(error);
    }
};

exports.getJobById = async (req, res, next) => {
    try {
        const job = await Job.findById(req.params.id).populate('postedBy', 'name email');
        if (!job) {
            res.status(404);
            return next(new Error('Job not found or invalid format'));
        }
        res.status(200).json({ success: true, data: job });
    } catch (error) {
        next(error);
    }
};

exports.updateJob = async (req, res, next) => {
    try {
        let job = await Job.findById(req.params.id);

        if (!job) {
            res.status(404);
            return next(new Error('Job not found'));
        }

        if (job.postedBy.toString() !== req.user._id.toString()) {
            res.status(403);
            return next(new Error('User is not author of this modification'));
        }

        job = await Job.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true 
        });

        res.status(200).json({ success: true, data: job });
    } catch (error) {
        next(error);
    }
};

exports.deleteJob = async (req, res, next) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            res.status(404);
            return next(new Error('Job not found'));
        }

        if (job.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            res.status(403);
            return next(new Error('Insufficient permission to execute deletion'));
        }

        await job.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        next(error);
    }
};

exports.approveJob = async (req, res, next) => {
    try {
        const { status } = req.body;

        if (!['approved', 'rejected', 'pending'].includes(status)) {
            res.status(400);
            return next(new Error('Invalid status classification'));
        }

        const job = await Job.findByIdAndUpdate(
            req.params.id, 
            { status }, 
            { new: true, runValidators: true }
        );

        if (!job) {
            res.status(404);
            return next(new Error('Job identifier not discovered'));
        }

        res.status(200).json({ success: true, data: job });
    } catch (error) {
        next(error);
    }
};
