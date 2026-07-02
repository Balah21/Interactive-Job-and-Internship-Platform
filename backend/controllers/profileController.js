// This file determines interaction endpoints regulating detailed profile arrays natively updating complex metadata strings physically internally.
// It actively resolves buffer locations attaching Multer PDFs strictly generating interconnected web URLs properly globally!

const Profile = require('../models/Profile');

exports.getMyProfile = async (req, res, next) => {
    try {
        const profile = await Profile.findOne({ user: req.user._id }).populate('user', 'name email role');
        
        if (!profile) {
            res.status(404);
            return next(new Error('Identity missing comprehensive profile bindings'));
        }
        
        res.status(200).json({ success: true, data: profile });
    } catch (error) {
        next(error);
    }
};

exports.createOrUpdateProfile = async (req, res, next) => {
    try {
        const { bio, skills, education, experience, linkedIn, github } = req.body;
        
        let profileFields = {
            user: req.user._id,
            bio,
            skills,
            education,
            experience,
            linkedIn,
            github
        };

        let profile = await Profile.findOne({ user: req.user._id });

        if (profile) {
            profile = await Profile.findOneAndUpdate(
                { user: req.user._id },
                { $set: profileFields },
                { new: true, runValidators: true }
            );
            return res.status(200).json({ success: true, data: profile });
        }

        profile = await Profile.create(profileFields);
        res.status(201).json({ success: true, data: profile });
        
    } catch (error) {
        next(error);
    }
};

exports.uploadResume = async (req, res, next) => {
    try {
        if (!req.file) {
            res.status(400);
            return next(new Error('Strict PDF submission requirement omitted'));
        }

        const resumeUrl = `/${req.file.path.replace(/\\/g, '/')}`; 

        let profile = await Profile.findOne({ user: req.user._id });
        
        if (!profile) {
            res.status(404);
            return next(new Error('Cannot tether resume natively without an explicit profile generated prior'));
        }

        profile.resumeUrl = resumeUrl;
        await profile.save();

        res.status(200).json({ success: true, data: profile });
    } catch (error) {
        next(error);
    }
};
