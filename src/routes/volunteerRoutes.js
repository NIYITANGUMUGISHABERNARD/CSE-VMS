const express = require("express");

const {
    authenticateToken
} = require("../middleware/authMiddleware");

const {
    requirePermission
} = require("../middleware/permissionMiddleware");

const {
    createVolunteerProfile,
    getVolunteerProfile,
    updateVolunteerProfile,
    deleteVolunteerProfile,
    submitSkill,
    getVolunteerAssignments,
    respondToAssignment,
    provideFeedback
} = require("../controllers/volunteerController");

const router = express.Router();


// Create Volunteer Profile
router.post(
    "/profile",
    authenticateToken,
    requirePermission("CREATE_VOLUNTEER_PROFILE"),
    createVolunteerProfile
);


// Get Volunteer Profile
router.get(
    "/profile",
    authenticateToken,
    requirePermission("CREATE_VOLUNTEER_PROFILE"),
    getVolunteerProfile
);


// Update Volunteer Profile
router.put(
    "/profile",
    authenticateToken,
    requirePermission("CREATE_VOLUNTEER_PROFILE"),
    updateVolunteerProfile
);


// Delete Volunteer Profile
router.delete(
    "/profile",
    authenticateToken,
    requirePermission("CREATE_VOLUNTEER_PROFILE"),
    deleteVolunteerProfile
);


// Submit Volunteer Skill
router.post(
    "/skills",
    authenticateToken,
    requirePermission("SUBMIT_SKILLS"),
    submitSkill
);


// View Volunteer Assignments
router.get(
    "/assignments",
    authenticateToken,
    requirePermission("VIEW_RESPOND_ASSIGNMENTS"),
    getVolunteerAssignments
);


// Respond to Assignment
router.put(
    "/assignments/:id/respond",
    authenticateToken,
    requirePermission("VIEW_RESPOND_ASSIGNMENTS"),
    respondToAssignment
);


// Provide Service Feedback
router.post(
    "/feedback",
    authenticateToken,
    requirePermission("PROVIDE_SERVICE_FEEDBACK"),
    provideFeedback
);


module.exports = router;
