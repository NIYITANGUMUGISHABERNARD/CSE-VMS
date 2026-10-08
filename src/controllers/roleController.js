const db = require("../config/database");

async function getRoles(req, res) {
    try {
        const [roles] = await db.execute(
            `SELECT id, role_name, description
             FROM roles
             ORDER BY id`
        );

        return res.status(200).json({
            success: true,
            roles
        });

    } catch (error) {
        console.error("Get roles error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while retrieving roles."
        });
    }
}

async function getPermissions(req, res) {
    try {
        const [permissions] = await db.execute(
            `SELECT id, permission_name, description
             FROM permissions
             ORDER BY id`
        );

        return res.status(200).json({
            success: true,
            permissions
        });

    } catch (error) {
        console.error("Get permissions error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while retrieving permissions."
        });
    }
}

async function getRolePermissions(req, res) {
    try {
        const roleId = Number(req.params.id);

        if (!Number.isInteger(roleId) || roleId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid role ID."
            });
        }

        const [roles] = await db.execute(
            `SELECT id, role_name, description
             FROM roles
             WHERE id = ?`,
            [roleId]
        );

        if (roles.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Role not found."
            });
        }

        const [permissions] = await db.execute(
            `SELECT
                p.id,
                p.permission_name,
                p.description
             FROM role_permissions rp
             INNER JOIN permissions p
                ON rp.permission_id = p.id
             WHERE rp.role_id = ?
             ORDER BY p.id`,
            [roleId]
        );

        return res.status(200).json({
            success: true,
            role: roles[0],
            permissions
        });

    } catch (error) {
        console.error("Get role permissions error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while retrieving role permissions."
        });
    }
}

async function updateRolePermissions(req, res) {
    const connection = await db.getConnection();

    try {
        const roleId = Number(req.params.id);
        const { permission_ids } = req.body;

        if (!Number.isInteger(roleId) || roleId <= 0) {
            connection.release();

            return res.status(400).json({
                success: false,
                message: "Invalid role ID."
            });
        }

        if (!Array.isArray(permission_ids)) {
            connection.release();

            return res.status(400).json({
                success: false,
                message: "permission_ids must be an array."
            });
        }

        const permissionIds = [
            ...new Set(
                permission_ids.map(Number)
            )
        ];

        if (
            permissionIds.some(
                id => !Number.isInteger(id) || id <= 0
            )
        ) {
            connection.release();

            return res.status(400).json({
                success: false,
                message: "All permission IDs must be valid positive integers."
            });
        }

        const [roles] = await connection.execute(
            `SELECT id, role_name
             FROM roles
             WHERE id = ?`,
            [roleId]
        );

        if (roles.length === 0) {
            connection.release();

            return res.status(404).json({
                success: false,
                message: "Role not found."
            });
        }

        if (permissionIds.length > 0) {
            const placeholders = permissionIds
                .map(() => "?")
                .join(",");

            const [permissions] = await connection.execute(
                `SELECT id
                 FROM permissions
                 WHERE id IN (${placeholders})`,
                permissionIds
            );

            if (permissions.length !== permissionIds.length) {
                connection.release();

                return res.status(400).json({
                    success: false,
                    message: "One or more permission IDs do not exist."
                });
            }
        }

        await connection.beginTransaction();

        await connection.execute(
            `DELETE FROM role_permissions
             WHERE role_id = ?`,
            [roleId]
        );

        if (permissionIds.length > 0) {
            const values = permissionIds
                .map(permissionId => [roleId, permissionId]);

            await connection.query(
                `INSERT INTO role_permissions
                    (role_id, permission_id)
                 VALUES ?`,
                [values]
            );
        }

        await connection.execute(
            `INSERT INTO activity_logs
                (user_id, action, description)
             VALUES (?, ?, ?)`,
            [
                req.user.id,
                "MANAGE_ROLES_PERMISSIONS",
                `Updated permissions for ${roles[0].role_name} role.`
            ]
        );

        await connection.commit();

        return res.status(200).json({
            success: true,
            message: "Role permissions updated successfully.",
            role: {
                id: roleId,
                role_name: roles[0].role_name
            },
            permission_ids: permissionIds
        });

    } catch (error) {
        await connection.rollback();

        console.error("Update role permissions error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while updating role permissions."
        });

    } finally {
        connection.release();
    }
}

module.exports = {
    getRoles,
    getPermissions,
    getRolePermissions,
    updateRolePermissions
};
