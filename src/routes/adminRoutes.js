const express = require("express");

const {
    authenticateToken
} = require("../middleware/authMiddleware");

const {
    requirePermission
} = require("../middleware/permissionMiddleware");

const {
    getSkills,
    createSkill,
    updateSkill,
    deleteSkill,
    getCommunityNeeds
} = require("../controllers/adminController");

const router = express.Router();


// =====================================================
// SKILLS MANAGEMENT
// =====================================================

router.get(
    "/skills",
    authenticateToken,
    requirePermission("MANAGE_SKILLS"),
    getSkills
);

router.post(
    "/skills",
    authenticateToken,
    requirePermission("MANAGE_SKILLS"),
    createSkill
);

router.put(
    "/skills/:id",
    authenticateToken,
    requirePermission("MANAGE_SKILLS"),
    updateSkill
);

router.delete(
    "/skills/:id",
    authenticateToken,
    requirePermission("MANAGE_SKILLS"),
    deleteSkill
);


// =====================================================
// COMMUNITY NEEDS MANAGEMENT
// =====================================================

router.get(
    "/community-needs",
    authenticateToken,
    requirePermission("REVIEW_COMMUNITY_NEEDS"),
    getCommunityNeeds
);


module.exports = router;
