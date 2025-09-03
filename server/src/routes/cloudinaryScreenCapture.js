import { Router } from "express";
import {
    uploadScreenshot,
    canTakeScreenshot,
    getUserScreenshots,
    getProjectScreenshots,
    getScreenshotStats
} from "../controllers/snapShot.js";
import { verifyUser } from "../middleware/authMiddleware.js";
import { ROLES } from "../config/roles.js";
import { upload } from "../middleware/multerMiddleware.js";
// import { upload } from "../middleware/multerMiddleware.js";

const router = Router();

// Check if user can take screenshot (timer status check)
router.get(
    "/can-capture",
    verifyUser([ROLES.USER, ROLES.COMPANY, ROLES.QCADMIN]),
    canTakeScreenshot
);

// Upload screenshot - Only when timer is actively running
router.post(
    "/upload",
    // verifyUser(),
    verifyUser([ROLES.USER, ROLES.COMPANY, ROLES.QCADMIN]),
    // upload.single("screenshot"),
    upload.any(),
    // upload.single("screenshot"),
    uploadScreenshot
);

// Get user's own screenshots for a project
// Query: projectId (required), limit, page
router.get(
    "/my-screenshots",
    verifyUser([ROLES.USER, ROLES.COMPANY, ROLES.QCADMIN]),
    getUserScreenshots
);

// Get project screenshots - Company/Admin only
// Query: projectId (required), userId, startDate, endDate, limit, page
router.get(
    "/project-screenshots",
    verifyUser([ROLES.COMPANY, ROLES.QCADMIN]),
    getProjectScreenshots
);

// Get screenshot statistics - Company/Admin only
// Query: projectId, startDate, endDate
router.get(
    "/stats",
    verifyUser([ROLES.COMPANY, ROLES.QCADMIN]),
    getScreenshotStats
);

export default router;