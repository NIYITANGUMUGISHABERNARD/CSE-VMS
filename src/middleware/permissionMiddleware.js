const db = require("../config/database");

function requirePermission(permissionName) {
    return async (req, res, next) => {
        try {
            if (!req.user || !req.user.id) {
                return res.status(401).json({
                    success: false,
                    message: "Authentication is required."
                });
            }

            const [permissions] = await db.execute(
                `SELECT 
                    p.permission_name
                 FROM role_permissions rp
                 INNER JOIN permissions p 
                    ON rp.permission_id = p.id
                 INNER JOIN users u 
                    ON rp.role_id = u.role_id
                 WHERE u.id = ?
                   AND p.permission_name = ?`,
                [req.user.id, permissionName]
            );

            if (permissions.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: "You do not have this permission."
                });
            }

            next();

        } catch (error) {
            console.error("Permission check error:", error);

            return res.status(500).json({
                success: false,
                message: "Server error while checking permission."
            });
        }
    };
}

module.exports = {
    requirePermission
};
