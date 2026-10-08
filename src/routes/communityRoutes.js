const express = require("express");

const {
    authenticateToken
} = require("../middleware/authMiddleware");

const {
    requirePermission
} = require("../middleware/permissionMiddleware");

const {
    createCommunityProfile,
    getMyCommunityProfile,
    updateMyCommunityProfile,
    deleteMyCommunityProfile,
    getCommunityMembers,
    getCommunitySkills,
    createCommunityNeed,
    getCommunityNeeds,
    viewAvailableVolunteers,
    viewAssignedVolunteer
} = require("../controllers/communityController");
const router = express.Router();


// =====================================================
// 1. CREATE COMMUNITY MEMBER PROFILE
// =====================================================
router.post(
    "/profile",
    authenticateToken,
    requirePermission("CREATE_COMMUNITY_PROFILE"),
    createCommunityProfile
);
// =====================================================
// 2. VIEW MY COMMUNITY MEMBER PROFILE
// =====================================================
router.get(
    "/profile",
    authenticateToken,
    getMyCommunityProfile
);


// =====================================================
// 3. UPDATE MY COMMUNITY MEMBER PROFILE
// =====================================================
router.put(
    "/profile",
    authenticateToken,
    requirePermission("CREATE_COMMUNITY_PROFILE"),
    updateMyCommunityProfile
);


// =====================================================
// 4. DELETE MY COMMUNITY MEMBER PROFILE
// =====================================================
router.delete(
    "/profile",
    authenticateToken,
    requirePermission("CREATE_COMMUNITY_PROFILE"),
    deleteMyCommunityProfile
);


// =====================================================
// 5. VIEW COMMUNITY MEMBERS
// =====================================================
router.get(
    "/members",
    authenticateToken,
    requirePermission("VIEW_COMMUNITY_MEMBERS"),
    getCommunityMembers
);

// =====================================================
// 2. GET COMMUNITY SKILLS
// =====================================================
router.get(
    "/skills",
    authenticateToken,
    getCommunitySkills
);


// =====================================================
// 3. POST COMMUNITY NEED
// =====================================================
router.post(
    "/needs",
    authenticateToken,
    requirePermission("SUBMIT_NEEDS"),
    createCommunityNeed
);


// =====================================================
// 4. GET COMMUNITY NEEDS
// =====================================================
router.get(
    "/needs",
    authenticateToken,
    requirePermission("REVIEW_COMMUNITY_NEEDS"),
    getCommunityNeeds
);


// =====================================================
// 5. VIEW AVAILABLE VOLUNTEERS
// =====================================================
router.get(
    "/volunteers",
    authenticateToken,
    requirePermission("VIEW_AVAILABLE_VOLUNTEERS"),
    viewAvailableVolunteers
);


// =====================================================
// 6. VIEW ASSIGNED VOLUNTEER
// =====================================================
router.get(
    "/assigned-volunteer",
    authenticateToken,
    viewAssignedVolunteer
);


module.exports = router;