const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/database");

async function login(req, res) {
    try {
        const { email, password } = req.body;

        console.log("Login attempt:", email);

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        // Find user
        const [users] = await db.execute(
            `SELECT
                u.id,
                u.full_name,
                u.email,
                u.password,
                u.phone,
                u.status,
                u.role_id,
                r.role_name
             FROM users u
             INNER JOIN roles r ON u.role_id = r.id
             WHERE u.email = ?`,
            [email]
        );

        console.log("Users found:", users.length);

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const user = users[0];

        // Check account status
        if (user.status !== "Active") {
            return res.status(403).json({
                success: false,
                message: "Your account is not active."
            });
        }

        // Check password
        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        console.log("Password match:", passwordMatch);

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        // Create JWT token
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role_id: user.role_id,
                role_name: user.role_name
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "8h"
            }
        );

        // Activity logging should NOT prevent successful login
        try {
            await db.execute(
                `INSERT INTO activity_logs
                    (user_id, action, description)
                 VALUES (?, ?, ?)`,
                [
                    user.id,
                    "LOGIN",
                    "User logged into the system."
                ]
            );

            console.log("Login activity recorded successfully.");

        } catch (logError) {
            console.error(
                "WARNING: Login succeeded, but activity log failed:",
                logError
            );
        }

        // Successful login response
        return res.status(200).json({
            success: true,
            message: "Login successful.",
            token,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                role_id: user.role_id,
                role_name: user.role_name
            }
        });

    } catch (error) {
        console.error("LOGIN ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Server error during login."
        });
    }
}

module.exports = {
    login
};