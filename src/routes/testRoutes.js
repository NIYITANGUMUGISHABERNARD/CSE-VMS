const express = require("express");
const { authenticateToken } = require("../middleware/authMiddleware");
const { requirePermission } = require("../middleware/permissionMiddleware");

const router = express.Router();

router.get(
    "/create-user-test",
    authenticateToken,
    requirePermission("CREATE_USER"),
    (req, res) => {
        res.json({
            success: true,
            message: "CREATE_USER permission granted."
        });
    }
);

module.exports = router;
