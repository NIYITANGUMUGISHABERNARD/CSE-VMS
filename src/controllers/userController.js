const bcrypt = require("bcryptjs");
const db = require("../config/database");

/*
|--------------------------------------------------------------------------
| CREATE USER
|--------------------------------------------------------------------------
*/
async function createUser(req, res) {
    try {
        const {
            full_name,
            email,
            password,
            phone,
            role_id,
            status
        } = req.body;

        if (!full_name || !email || !password || !phone || !role_id) {
            return res.status(400).json({
                success: false,
                message: "Full name, email, password, phone and role are required."
            });
        }

        const roleId = Number(role_id);

        if (!Number.isInteger(roleId) || roleId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid role ID."
            });
        }

        const [existingUsers] = await db.execute(
            "SELECT id FROM users WHERE email = ?",
            [email.trim()]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: "A user with this email already exists."
            });
        }

        const [roles] = await db.execute(
            "SELECT id, role_name FROM roles WHERE id = ?",
            [roleId]
        );

        if (roles.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid role selected."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const userStatus = status === "Inactive"
            ? "Inactive"
            : "Active";

        const [result] = await db.execute(
            `INSERT INTO users
                (role_id, full_name, email, password, phone, status)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                roleId,
                full_name.trim(),
                email.trim(),
                hashedPassword,
                phone.trim(),
                userStatus
            ]
        );

        await db.execute(
            `INSERT INTO activity_logs
                (user_id, action, description)
             VALUES (?, ?, ?)`,
            [
                req.user.id,
                "CREATE_USER",
                `Created user account for ${email.trim()}.`
            ]
        );

        return res.status(201).json({
            success: true,
            message: "User account created successfully.",
            user: {
                id: result.insertId,
                full_name: full_name.trim(),
                email: email.trim(),
                phone: phone.trim(),
                role_id: roleId,
                role_name: roles[0].role_name,
                status: userStatus
            }
        });

    } catch (error) {
        console.error("Create user error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while creating user."
        });
    }
}


/*
|--------------------------------------------------------------------------
| GET ALL USERS
|--------------------------------------------------------------------------
*/
async function getUsers(req, res) {
    try {
        const [users] = await db.execute(
            `SELECT
                u.id,
                u.full_name,
                u.email,
                u.phone,
                u.status,
                u.role_id,
                r.role_name,
                u.created_at,
                u.updated_at
             FROM users u
             INNER JOIN roles r
                ON u.role_id = r.id
             ORDER BY u.id ASC`
        );

        return res.status(200).json({
            success: true,
            count: users.length,
            users
        });

    } catch (error) {
        console.error("Get users error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while retrieving users."
        });
    }
}


/*
|--------------------------------------------------------------------------
| GET ONE USER
|--------------------------------------------------------------------------
*/
async function getUserById(req, res) {
    try {
        const userId = Number(req.params.id);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID."
            });
        }

        const [users] = await db.execute(
            `SELECT
                u.id,
                u.full_name,
                u.email,
                u.phone,
                u.status,
                u.role_id,
                r.role_name,
                u.created_at,
                u.updated_at
             FROM users u
             INNER JOIN roles r
                ON u.role_id = r.id
             WHERE u.id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        return res.status(200).json({
            success: true,
            user: users[0]
        });

    } catch (error) {
        console.error("Get user error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while retrieving user."
        });
    }
}


/*
|--------------------------------------------------------------------------
| UPDATE USER
|--------------------------------------------------------------------------
*/
async function updateUser(req, res) {
    try {
        const userId = Number(req.params.id);

        const {
            full_name,
            email,
            phone,
            role_id,
            status
        } = req.body;

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID."
            });
        }

        if (!full_name || !email || !phone || !role_id) {
            return res.status(400).json({
                success: false,
                message: "Full name, email, phone and role are required."
            });
        }

        const roleId = Number(role_id);

        if (!Number.isInteger(roleId) || roleId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid role ID."
            });
        }

        const userStatus = status === "Inactive"
            ? "Inactive"
            : "Active";

        const [users] = await db.execute(
            "SELECT id, email FROM users WHERE id = ?",
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        const [duplicateEmail] = await db.execute(
            `SELECT id
             FROM users
             WHERE email = ?
             AND id <> ?`,
            [email.trim(), userId]
        );

        if (duplicateEmail.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Another user already uses this email."
            });
        }

        const [roles] = await db.execute(
            "SELECT id, role_name FROM roles WHERE id = ?",
            [roleId]
        );

        if (roles.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid role selected."
            });
        }

        await db.execute(
            `UPDATE users
             SET
                full_name = ?,
                email = ?,
                phone = ?,
                role_id = ?,
                status = ?,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [
                full_name.trim(),
                email.trim(),
                phone.trim(),
                roleId,
                userStatus,
                userId
            ]
        );

        await db.execute(
            `INSERT INTO activity_logs
                (user_id, action, description)
             VALUES (?, ?, ?)`,
            [
                req.user.id,
                "UPDATE_USER",
                `Updated user ID ${userId}.`
            ]
        );

        return res.status(200).json({
            success: true,
            message: "User updated successfully.",
            user: {
                id: userId,
                full_name: full_name.trim(),
                email: email.trim(),
                phone: phone.trim(),
                role_id: roleId,
                role_name: roles[0].role_name,
                status: userStatus
            }
        });

    } catch (error) {
        console.error("Update user error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while updating user."
        });
    }
}


/*
|--------------------------------------------------------------------------
| CHANGE USER ROLE
|--------------------------------------------------------------------------
*/
async function changeUserRole(req, res) {
    try {
        const userId = Number(req.params.id);
        const roleId = Number(req.body.role_id);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID."
            });
        }

        if (!Number.isInteger(roleId) || roleId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid role ID."
            });
        }

        const [users] = await db.execute(
            "SELECT id, full_name FROM users WHERE id = ?",
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        const [roles] = await db.execute(
            "SELECT id, role_name FROM roles WHERE id = ?",
            [roleId]
        );

        if (roles.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid role selected."
            });
        }

        await db.execute(
            `UPDATE users
             SET role_id = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [roleId, userId]
        );

        await db.execute(
            `INSERT INTO activity_logs
                (user_id, action, description)
             VALUES (?, ?, ?)`,
            [
                req.user.id,
                "CHANGE_USER_ROLE",
                `Changed role of user ID ${userId} to ${roles[0].role_name}.`
            ]
        );

        return res.status(200).json({
            success: true,
            message: "User role changed successfully.",
            user: {
                id: userId,
                full_name: users[0].full_name,
                role_id: roleId,
                role_name: roles[0].role_name
            }
        });

    } catch (error) {
        console.error("Change user role error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while changing user role."
        });
    }
}


/*
|--------------------------------------------------------------------------
| ACTIVATE USER
|--------------------------------------------------------------------------
*/
async function activateUser(req, res) {
    try {
        const userId = Number(req.params.id);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID."
            });
        }

        const [users] = await db.execute(
            "SELECT id, full_name FROM users WHERE id = ?",
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        await db.execute(
            `UPDATE users
             SET status = 'Active',
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [userId]
        );

        await db.execute(
            `INSERT INTO activity_logs
                (user_id, action, description)
             VALUES (?, ?, ?)`,
            [
                req.user.id,
                "ACTIVATE_USER",
                `Activated user ID ${userId}.`
            ]
        );

        return res.status(200).json({
            success: true,
            message: "User activated successfully."
        });

    } catch (error) {
        console.error("Activate user error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while activating user."
        });
    }
}


/*
|--------------------------------------------------------------------------
| DEACTIVATE USER
|--------------------------------------------------------------------------
*/
async function deactivateUser(req, res) {
    try {
        const userId = Number(req.params.id);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID."
            });
        }

        if (userId === req.user.id) {
            return res.status(400).json({
                success: false,
                message: "You cannot deactivate your own account."
            });
        }

        const [users] = await db.execute(
            "SELECT id, full_name FROM users WHERE id = ?",
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found."
            });
        }

        await db.execute(
            `UPDATE users
             SET status = 'Inactive',
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [userId]
        );

        await db.execute(
            `INSERT INTO activity_logs
                (user_id, action, description)
             VALUES (?, ?, ?)`,
            [
                req.user.id,
                "DEACTIVATE_USER",
                `Deactivated user ID ${userId}.`
            ]
        );

        return res.status(200).json({
            success: true,
            message: "User deactivated successfully."
        });

    } catch (error) {
        console.error("Deactivate user error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while deactivating user."
        });
    }
}


module.exports = {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    changeUserRole,
    activateUser,
    deactivateUser
};