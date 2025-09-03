import { SnapShot } from "../models/snapShot.js";
import { userTracker } from "../models/TrackerTime.js";
import { User } from "../models/userModel.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ROLES } from "../config/roles.js";
import mongoose from "mongoose";

// Helper function to get user's company ID
const getUserCompanyId = (user) => {
    if (user.role === ROLES.COMPANY) return user._id;
    if (user.role === ROLES.USER && user.companyId) return user.companyId;
    if (user.role === ROLES.QCADMIN && user.companyId) return user.companyId;
    return null;
};

// Simple Screenshot Upload - Only when timer is active
const uploadScreenshot = asyncHandler(async (req, res) => {
    if (!req.user) {
        return res.status(401).json(
            new apiResponse(401, null, "Authentication failed - user not found")
        );
    }

    const file = req.files.find(f => f.fieldname === "screenshot");
    const userId = req.user._id;
    const companyId = getUserCompanyId(req.user);

    if (!file) {
        throw new apiError(400, "No image file provided");
    }

    if (!companyId) {
        throw new apiError(400, "Company ID required");
    }

    const activeTimer = await userTracker
        .findOne({
            userId,
            companyId,
            isRunning: true,
            isCheckedOut: false,
            checkIn: { $ne: null }
        })
        .populate("projectId", "projectTitle")
        .lean();

    if (!activeTimer) {
        throw new apiError(
            403,
            "Screenshot can only be taken when timer is actively running"
        );
    }

    const uploadResult = await uploadOnCloudinary(file.path);

    if (!uploadResult) {
        throw new apiError(500, "Failed to upload screenshot");
    }

    const screenshot = await SnapShot.create({
        imageUrl: uploadResult.secure_url,
        userId,
        projectId: activeTimer.projectId._id,
        companyId,
        userInfo: userId,
        captureTime: new Date()
    });

    res.status(200).json(
        new apiResponse(200, {
            screenshotId: screenshot._id,
            imageUrl: screenshot.imageUrl,
            projectTitle: activeTimer.projectId.projectTitle,
            captureTime: screenshot.captureTime
        }, "Screenshot uploaded successfully")
    );
});


// Check if user can take screenshot (timer status)
const canTakeScreenshot = asyncHandler(async (req, res) => {
    if (!req.user) {
        return res.status(401).json(
            new apiResponse(401, null, "Authentication failed - user not found")
        );
    }
    const userId = req.user._id;
    const companyId = getUserCompanyId(req.user);
    if (!companyId) {
        throw new apiError(400, "Company ID required");
    }

    // Find active timer
    const activeTimer = await userTracker
        .findOne({
            userId,
            companyId,
            isRunning: true,
            isCheckedOut: false,
            checkIn: { $ne: null }
        })
        .populate("projectId", "projectTitle")
        .lean();

    const canCapture = !!activeTimer;

    res.status(200).json(
        new apiResponse(200, {
            canTakeScreenshot: canCapture,
            isTimerActive: canCapture,
            currentProject: activeTimer ? {
                id: activeTimer.projectId._id,
                title: activeTimer.projectId.projectTitle
            } : null,
            checkInTime: activeTimer?.checkIn || null
        }, canCapture ? "Screenshot allowed" : "No active timer found")
    );
});

// Get user's screenshots for a project
const getUserScreenshots = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const companyId = getUserCompanyId(req.user);
    const { projectId, limit = 20, page = 1 } = req.query;

    if (!companyId) {
        throw new apiError(400, "Company ID required");
    }

    if (!projectId || !mongoose.isValidObjectId(projectId)) {
        throw new apiError(400, "Valid Project ID required");
    }

    const skip = (page - 1) * limit;

    const screenshots = await SnapShot.find({
        userId,
        projectId,
        companyId
    })
        .populate("projectId", "projectTitle")
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean();

    const total = await SnapShot.countDocuments({
        userId,
        projectId,
        companyId
    });

    res.status(200).json(
        new apiResponse(200, {
            screenshots,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        }, "Screenshots fetched successfully")
    );
});

// Company/Admin: Get screenshots for project
const getProjectScreenshots = asyncHandler(async (req, res) => {
    const requesterRole = req.user.role;
    const companyId = getUserCompanyId(req.user);
    const { projectId, userId, startDate, endDate, limit = 50, page = 1 } = req.query;

    // Only Company and QC Admin can access
    if (requesterRole !== ROLES.COMPANY && requesterRole !== ROLES.QCADMIN) {
        throw new apiError(403, "Access denied");
    }

    if (!companyId) {
        throw new apiError(400, "Company ID required");
    }

    if (!projectId || !mongoose.isValidObjectId(projectId)) {
        throw new apiError(400, "Valid Project ID required");
    }

    const matchQuery = {
        projectId: new mongoose.Types.ObjectId(projectId),
        companyId: new mongoose.Types.ObjectId(companyId)
    };

    // Filter by user if specified
    if (userId) {
        if (!mongoose.isValidObjectId(userId)) {
            throw new apiError(400, "Valid User ID required");
        }
        matchQuery.userId = new mongoose.Types.ObjectId(userId);
    }

    // Filter by date range
    if (startDate && endDate) {
        matchQuery.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate + 'T23:59:59.999Z')
        };
    }

    const skip = (page - 1) * limit;

    const screenshots = await SnapShot.find(matchQuery)
        .populate("userId", "name email")
        .populate("projectId", "projectTitle")
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean();

    const total = await SnapShot.countDocuments(matchQuery);

    res.status(200).json(
        new apiResponse(200, {
            screenshots,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        }, "Project screenshots fetched successfully")
    );
});

// Simple screenshot stats for dashboard
const getScreenshotStats = asyncHandler(async (req, res) => {
    const requesterRole = req.user.role;
    const companyId = getUserCompanyId(req.user);
    const { projectId, startDate, endDate } = req.query;

    if (requesterRole !== ROLES.COMPANY && requesterRole !== ROLES.QCADMIN) {
        throw new apiError(403, "Access denied");
    }

    if (!companyId) {
        throw new apiError(400, "Company ID required");
    }

    const matchQuery = { companyId: new mongoose.Types.ObjectId(companyId) };

    if (projectId) {
        matchQuery.projectId = new mongoose.Types.ObjectId(projectId);
    }

    if (startDate && endDate) {
        matchQuery.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate + 'T23:59:59.999Z')
        };
    }

    const stats = await SnapShot.aggregate([
        { $match: matchQuery },
        {
            $group: {
                _id: "$projectId",
                totalScreenshots: { $sum: 1 },
                uniqueUsers: { $addToSet: "$userId" },
                latestScreenshot: { $max: "$createdAt" }
            }
        },
        {
            $lookup: {
                from: "usertasks",
                localField: "_id",
                foreignField: "_id",
                as: "project"
            }
        },
        { $unwind: "$project" },
        {
            $project: {
                projectId: "$_id",
                projectTitle: "$project.projectTitle",
                totalScreenshots: 1,
                uniqueUsersCount: { $size: "$uniqueUsers" },
                latestScreenshot: 1
            }
        },
        { $sort: { totalScreenshots: -1 } }
    ]);

    res.status(200).json(
        new apiResponse(200, stats, "Screenshot statistics fetched successfully")
    );
});

export {
    uploadScreenshot,
    canTakeScreenshot,
    getUserScreenshots,
    getProjectScreenshots,
    getScreenshotStats
};