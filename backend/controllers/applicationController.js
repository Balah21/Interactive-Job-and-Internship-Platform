// This file resolves complex intersection arrays coupling isolated Student identities physically upon published Employer job postings.
// It actively shields uniqueness constraints enforcing timeline barriers logically preventing structural document corruption.

const Application = require('../models/Application');
const Job = require('../models/Job');

exports.applyToJob = async (req, res, next) => {
    try {
        const jobId = req.params.jobId;

        const job = await Job.findById(jobId);
        if (!job) {
            res.status(404);
            return next(new Error('Target job is non-existent within the database'));
        }

        if (job.status !== 'approved') {
            res.status(400);
            return next(new Error('This job is not publicly open for applications'));
        }

        if (job.deadline && new Date(job.deadline) < new Date()) {
            res.status(400);
            return next(new Error('The submission deadline for this job array has unfortunately passed'));
        }

        const existingApplication = await Application.findOne({
            job: jobId,
            applicant: req.user._id
        });

        if (existingApplication) {
            res.status(400);
            return next(new Error('You have actively applied to this job previously'));
        }

        const application = await Application.create({
            job: jobId,
            applicant: req.user._id,
            coverLetter: req.body.coverLetter,
            resumeUrl: req.body.resumeUrl
        });

        res.status(201).json({ success: true, data: application });
    } catch (error) {
        if (error.code === 11000) {
            res.status(400);
            return next(new Error('Simultaneous duplicate request processed. You have already applied.')); 
        }
        next(error);
    }
};

exports.getMyApplications = async (req, res, next) => {
    try {
        const applications = await Application.find({ applicant: req.user._id })
            .populate({
                path: 'job',
                select: 'title company location status deadline'
            });

        res.status(200).json({ success: true, count: applications.length, data: applications });
    } catch (error) {
        next(error);
    }
};

exports.getJobApplications = async (req, res, next) => {
    try {
        const jobId = req.params.jobId;

        const job = await Job.findById(jobId);
        if (!job) {
            res.status(404);
            return next(new Error('Origin job could not be retrieved'));
        }

        if (job.postedBy.toString() !== req.user._id.toString()) {
            res.status(403);
            return next(new Error('You maintain zero authorization limits over applicant statistics for foreign posts'));
        }

        const applications = await Application.find({ job: jobId })
            .populate('applicant', 'name email');

        res.status(200).json({ success: true, count: applications.length, data: applications });
    } catch (error) {
        next(error);
    }
};

exports.updateApplicationStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!['applied', 'reviewed', 'shortlisted', 'rejected'].includes(status)) {
            res.status(400);
            return next(new Error('Incompatible pipeline status declaration'));
        }

        let application = await Application.findById(req.params.id).populate('job');
        if (!application) {
            res.status(404);
            return next(new Error('Direct applicant entry nullified/not found'));
        }

        if (application.job.postedBy.toString() !== req.user._id.toString()) {
            res.status(403);
            return next(new Error('Insufficient modifier access toward this application'));
        }

        application.status = status;
        await application.save();

        res.status(200).json({ success: true, data: application });
    } catch (error) {
        next(error);
    }
};

exports.withdrawApplication = async (req, res, next) => {
    try {
        const application = await Application.findById(req.params.id);

        if (!application) {
            res.status(404);
            return next(new Error('Document target reference failure'));
        }

        if (application.applicant.toString() !== req.user._id.toString()) {
            res.status(403);
            return next(new Error('Identity theft mitigation enabled! Unbound user detected'));
        }

        if (application.status !== 'applied') {
            res.status(400);
            return next(new Error('Operations halted: application has actively left the initial staging boundaries'));
        }

        await application.deleteOne();

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        next(error);
    }
};
