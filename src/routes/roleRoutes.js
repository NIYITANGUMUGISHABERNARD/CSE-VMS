const express = require("express");

const {
    authenticateToken
} = require("../middleware/authMiddleware");

const {
    requirePermission
} = require("../middleware/permissionMiddleware");

const {
    getRoles,
    getPermissions,
    getRolePermissions,
    updateRolePermissions
} = require("../controllers/roleController");

const router = express.Router();

router.get(
    "/",
    authenticateToken,
    requirePermission("MANAGE_ROLES_PERMISSIONS"),
    getRoles
);

router.get(
    "/permissions",
    authenticateToken,
    requirePermission("MANAGE_ROLES_PERMISSIONS"),
    getPermissions
);

router.get(
    "/:id/permissions",
    authenticateToken,
    requirePermission("MANAGE_ROLES_PERMISSIONS"),
    getRolePermissions
);

router.put(
    "/:id/permissions",
    authenticateToken,
    requirePermission("MANAGE_ROLES_PERMISSIONS"),
    updateRolePermissions
);

module.exports = router;
