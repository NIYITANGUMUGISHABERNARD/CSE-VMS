const express = require("express");

const {
    authenticateToken
} = require("../middleware/authMiddleware");

const {
    requirePermission
} = require("../middleware/permissionMiddleware");

const {
    getFeedbackServices,
    submitFeedback
} = require("../controllers/feedbackController");

const router = express.Router();


// =====================================================
// 1. VIEW SERVICES AVAILABLE FOR FEEDBACK
// =====================================================

router.get(
    "/services",
    authenticateToken,
    requirePermission("PROVIDE_SERVICE_FEEDBACK"),
    getFeedbackServices
);


// =====================================================
// 2. SUBMIT SERVICE FEEDBACK
// =====================================================

router.post(
    "/",
    authenticateToken,
    requirePermission("PROVIDE_SERVICE_FEEDBACK"),
    submitFeedback
);


module.exports = router;
