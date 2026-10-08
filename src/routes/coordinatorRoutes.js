const express = require("express");

const {
    authenticateToken
} = require("../middleware/authMiddleware");

const {
    requirePermission
} = require("../middleware/permissionMiddleware");

const {
    reviewVolunteerSkills,
    reviewCommunityNeeds,
    matchVolunteer,
    manageAssignments,
    approveOrRejectAssignment,
    recordParticipation
} = require("../controllers/coordinatorController");

const router = express.Router();


// Review volunteer profiles and submitted skills
router.get(
    "/volunteers",
    authenticateToken,
    requirePermission("REVIEW_VOLUNTEER_SKILLS"),
    reviewVolunteerSkills
);


// Review and evaluate community needs
router.get(
    "/needs",
    authenticateToken,
    requirePermission("REVIEW_COMMUNITY_NEEDS"),
    reviewCommunityNeeds
);


// Match volunteers with community needs
router.post(
    "/match",
    authenticateToken,
    requirePermission("MATCH_VOLUNTEERS"),
    matchVolunteer
);


// View and manage volunteer assignments
router.get(
    "/assignments",
    authenticateToken,
    requirePermission("MANAGE_ASSIGNMENTS"),
    manageAssignments
);


// Approve or reject volunteer assignments
router.post(
    "/assignments/decision",
    authenticateToken,
    requirePermission("MANAGE_ASSIGNMENTS"),
    approveOrRejectAssignment
);


// Record volunteer participation
router.post(
    "/participation",
    authenticateToken,
    requirePermission("TRACK_PARTICIPATION"),
    recordParticipation
);


module.exports = router;