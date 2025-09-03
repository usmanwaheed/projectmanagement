import mongoose from "mongoose";

const ScreenshotSchema = new mongoose.Schema(
    {
        imageUrl: {
            type: String,
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UserInfo",
            required: true,
        },
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "userTask",
            required: true,
        },
        companyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UserInfo",
            required: true,
        },
        userInfo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UserInfo",
            required: true,
        },
        // Simplified metadata
        captureTime: {
            type: Date,
            default: Date.now
        },
        // Optional fields for future use
        deviceInfo: String,
        screenResolution: String
    },
    {
        timestamps: true
    }
);

// Essential indexes for performance
ScreenshotSchema.index({ companyId: 1, projectId: 1 });
ScreenshotSchema.index({ userId: 1, projectId: 1 });
ScreenshotSchema.index({ companyId: 1, userId: 1 });
ScreenshotSchema.index({ createdAt: -1 });

// Static method to validate screenshot access
ScreenshotSchema.statics.validateAccess = async function (screenshotId, userId, companyId) {
    const screenshot = await this.findOne({
        _id: screenshotId,
        companyId
    });

    if (!screenshot) {
        throw new Error("Screenshot not found or access denied");
    }

    return screenshot;
};

// Static method to get user screenshots with pagination
ScreenshotSchema.statics.getUserScreenshots = function (userId, projectId, companyId, options = {}) {
    const { limit = 20, skip = 0 } = options;

    return this.find({
        userId,
        projectId,
        companyId
    })
        .populate("projectId", "projectTitle")
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean();
};

// Pre-save middleware
ScreenshotSchema.pre('save', function (next) {
    if (this.userId && !this.userInfo) {
        this.userInfo = this.userId;
    }
    next();
});

const SnapShot = mongoose.model("SnapShot", ScreenshotSchema);

export { SnapShot };
