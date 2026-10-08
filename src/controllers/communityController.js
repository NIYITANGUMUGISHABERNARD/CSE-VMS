const db = require("../config/database");
const { notifyAdmins } = require("../utils/notificationHelper");

// =====================================================
// 1. CREATE COMMUNITY MEMBER PROFILE
// =====================================================
async function createCommunityProfile(req, res) {
    try {
        const {
            full_name,
            address,
            phone,
            description
        } = req.body;

        if (!full_name || !address) {
            return res.status(400).json({
                success: false,
                message: "Full name and address are required."
            });
        }

        const [existingProfile] = await db.execute(
            `SELECT id
             FROM community_profiles
             WHERE user_id = ?`,
            [req.user.id]
        );

        if (existingProfile.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Community member profile already exists."
            });
        }

        const [result] = await db.execute(
            `INSERT INTO community_profiles
                (user_id, address, phone, description)
             VALUES (?, ?, ?, ?)`,
            [
                req.user.id,
                address,
                phone || null,
                description || null
            ]
        );

        await db.execute(
            `INSERT INTO activity_logs
                (user_id, action, description)
             VALUES (?, ?, ?)`,
            [
                req.user.id,
                "CREATE_COMMUNITY_PROFILE",
                "Created community member profile."
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Community member profile created successfully.",
            profile: {
                id: result.insertId,
                user_id: req.user.id,
                address,
                phone: phone || null,
                description: description || null
            }
        });

    } catch (error) {
        console.error(
            "Create community profile error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Server error while creating community profile."
        });
    }
}
// =====================================================
// 2. VIEW MY COMMUNITY MEMBER PROFILE
// =====================================================
async function getMyCommunityProfile(req, res) {
    try {
        const [profiles] = await db.execute(
            `SELECT
                cp.id,
                cp.user_id,
                u.full_name,
                u.email,
                u.phone AS user_phone,
                cp.address,
                cp.phone AS profile_phone,
                cp.description,
                cp.created_at
             FROM community_profiles cp
             INNER JOIN users u
                ON u.id = cp.user_id
             WHERE cp.user_id = ?`,
            [req.user.id]
        );

        if (profiles.length === 0) {
            return res.status(200).json({
                success: true,
                profileExists: false,
                message: "Community member profile not found.",
                profile: null
            });
        }

        return res.status(200).json({
            success: true,
            profileExists: true,
            message: "Community member profile retrieved successfully.",
            profile: profiles[0]
        });

    } catch (error) {
        console.error(
            "Get my community profile error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while retrieving your community profile."
        });
    }
}


// =====================================================
// 3. UPDATE MY COMMUNITY MEMBER PROFILE
// =====================================================
async function updateMyCommunityProfile(req, res) {
    try {
        const {
            full_name,
            address,
            phone,
            description
        } = req.body;

        if (!full_name || !address) {
            return res.status(400).json({
                success: false,
                message: "Full name and address are required."
            });
        }

        const [profiles] = await db.execute(
            `SELECT id
             FROM community_profiles
             WHERE user_id = ?`,
            [req.user.id]
        );

        if (profiles.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Community member profile not found."
            });
        }

        await db.execute(
            `UPDATE users
             SET full_name = ?,
                 phone = ?
             WHERE id = ?`,
            [
                full_name,
                phone || "",
                req.user.id
            ]
        );

        await db.execute(
            `UPDATE community_profiles
             SET address = ?,
                 phone = ?,
                 description = ?
             WHERE user_id = ?`,
            [
                address,
                phone || null,
                description || null,
                req.user.id
            ]
        );

        await db.execute(
            `INSERT INTO activity_logs
                (user_id, action, description)
             VALUES (?, ?, ?)`,
            [
                req.user.id,
                "UPDATE_COMMUNITY_PROFILE",
                "Updated community member profile."
            ]
        );

        const [updatedProfiles] = await db.execute(
            `SELECT
                cp.id,
                cp.user_id,
                u.full_name,
                u.email,
                u.phone AS user_phone,
                cp.address,
                cp.phone AS profile_phone,
                cp.description,
                cp.created_at
             FROM community_profiles cp
             INNER JOIN users u
                ON u.id = cp.user_id
             WHERE cp.user_id = ?`,
            [req.user.id]
        );

        return res.status(200).json({
            success: true,
            message:
                "Community member profile updated successfully.",
            profile: updatedProfiles[0]
        });

    } catch (error) {
        console.error(
            "Update my community profile error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while updating your community profile."
        });
    }
}


// =====================================================
// 4. DELETE MY COMMUNITY MEMBER PROFILE
// =====================================================
async function deleteMyCommunityProfile(req, res) {
    try {
        const userId = req.user.id;

        const [profiles] = await db.execute(
            `SELECT id
             FROM community_profiles
             WHERE user_id = ?
             LIMIT 1`,
            [userId]
        );

        if (profiles.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Community member profile not found."
            });
        }

        const profileId = profiles[0].id;

        await db.execute(
            `DELETE FROM community_profiles
             WHERE user_id = ?`,
            [userId]
        );

        try {
            await db.execute(
                `INSERT INTO activity_logs
                    (user_id, action, description)
                 VALUES (?, ?, ?)`,
                [
                    userId,
                    "DELETE_COMMUNITY_PROFILE",
                    `Deleted community member profile ID ${profileId}.`
                ]
            );
        } catch (logError) {
            console.error(
                "Profile deleted, but activity log could not be created:",
                logError
            );
        }

        return res.status(200).json({
            success: true,
            message: "Community member profile deleted successfully."
        });

    } catch (error) {
        console.error(
            "Delete my community profile error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while deleting your community profile."
        });
    }
}
async function getCommunityMembers(req, res) {
    try {
        const [members] = await db.execute(
            `SELECT
                u.id AS user_id,
                u.full_name,
                u.email,
                u.phone AS user_phone,
                u.status,

                cp.id AS profile_id,
                cp.address,
                cp.phone AS profile_phone,
                cp.description,
                cp.created_at AS profile_created_at

             FROM users u

             LEFT JOIN community_profiles cp
                ON cp.user_id = u.id

             WHERE u.role_id = 4

             ORDER BY u.full_name ASC`
        );

        return res.status(200).json({
            success: true,
            message:
                "Community members retrieved successfully.",
            count: members.length,
            members
        });

    } catch (error) {
        console.error(
            "Get community members error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while retrieving community members."
        });
    }
}

// =====================================================
// 2. GET COMMUNITY SKILLS
// =====================================================
async function getCommunitySkills(req, res) {
    try {
        const [skills] = await db.execute(
            `SELECT
                id,
                skill_name,
                description
             FROM skills
             ORDER BY skill_name ASC`
        );

        return res.status(200).json({
            success: true,
            message: "Skills retrieved successfully.",
            count: skills.length,
            skills
        });

    } catch (error) {
        console.error(
            "Get community skills error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Server error while retrieving skills."
        });
    }
}


// =====================================================
// 3. CREATE COMMUNITY NEED
// =====================================================
async function createCommunityNeed(req, res) {
    try {
        const {
            title,
            description,
            required_skill_id,
            location,
            urgency
        } = req.body;

        if (
            !title ||
            !description ||
            !required_skill_id ||
            !location ||
            !urgency
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Title, description, required skill, location and urgency are required."
            });
        }

        const [profiles] = await db.execute(
            `SELECT id
             FROM community_profiles
             WHERE user_id = ?`,
            [req.user.id]
        );

        if (profiles.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Community member profile not found. Please create your profile first."
            });
        }

        const communityMemberId = profiles[0].id;

        const [skills] = await db.execute(
            `SELECT
                id,
                skill_name
             FROM skills
             WHERE id = ?`,
            [required_skill_id]
        );

        if (skills.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Selected skill does not exist."
            });
        }

        const [result] = await db.execute(
            `INSERT INTO community_needs
                (
                    community_member_id,
                    title,
                    description,
                    required_skill_id,
                    location,
                    urgency,
                    status
                )
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                communityMemberId,
                title,
                description,
                required_skill_id,
                location,
                urgency,
                "Open"
            ]
        );

        await db.execute(
            `INSERT INTO activity_logs
                (user_id, action, description)
             VALUES (?, ?, ?)`,
            [
                req.user.id,
                "CREATE_COMMUNITY_NEED",
                `Created community need: ${title}`
            ]
        );

        await notifyAdmins(
            "New Community Need",
            `A new community need "${title}" was submitted in ${location}. Urgency: ${urgency}.`,
            "Community Need"
        );

        return res.status(201).json({
            success: true,
            message: "Community need posted successfully.",
            need: {
                id: result.insertId,
                community_member_id: communityMemberId,
                title,
                description,
                required_skill_id,
                skill_name: skills[0].skill_name,
                location,
                urgency,
                status: "Open"
            }
        });

    } catch (error) {
        console.error(
            "Create community need error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Server error while posting community need."
        });
    }
}


// =====================================================
// 4. GET COMMUNITY NEEDS
// =====================================================
async function getCommunityNeeds(req, res) {
    try {
        const [needs] = await db.execute(
            `SELECT
                cn.id,
                cn.community_member_id,
                u.full_name AS community_member_name,
                u.email AS community_member_email,
                cn.title,
                cn.description,
                cn.required_skill_id,
                s.skill_name,
                cn.location,
                cn.urgency,
                cn.status,
                cn.created_at
             FROM community_needs cn
             INNER JOIN community_profiles cp
                ON cp.id = cn.community_member_id
             INNER JOIN users u
                ON u.id = cp.user_id
             LEFT JOIN skills s
                ON s.id = cn.required_skill_id
             ORDER BY cn.created_at DESC`
        );

        return res.status(200).json({
            success: true,
            message: "Community needs retrieved successfully.",
            count: needs.length,
            needs
        });

    } catch (error) {
        console.error(
            "Get community needs error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while retrieving community needs."
        });
    }
}


// =====================================================
// 5. VIEW AVAILABLE VOLUNTEERS
// =====================================================
async function viewAvailableVolunteers(req, res) {
    try {
        const [volunteers] = await db.execute(
            `SELECT
                vp.id AS volunteer_profile_id,
                u.id AS user_id,
                u.full_name,
                vp.location,
                vp.availability,
                s.id AS skill_id,
                s.skill_name,
                vs.experience_level,
                vs.description AS skill_description
             FROM volunteer_profiles vp
             INNER JOIN users u
                ON u.id = vp.user_id
             INNER JOIN volunteer_skills vs
                ON vs.volunteer_id = vp.id
             INNER JOIN skills s
                ON s.id = vs.skill_id
             WHERE u.role_id = 3
               AND u.status = 'Active'
               AND vp.availability = 'Available'
             ORDER BY u.full_name ASC`
        );

        return res.status(200).json({
            success: true,
            message: "Available volunteers retrieved successfully.",
            count: volunteers.length,
            volunteers
        });

    } catch (error) {
        console.error(
            "View available volunteers error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while retrieving available volunteers."
        });
    }
}


// =====================================================
// 6. VIEW ASSIGNED VOLUNTEER
// =====================================================
async function viewAssignedVolunteer(req, res) {
    try {
        const [assignments] = await db.execute(
            `SELECT
                a.id AS assignment_id,
                a.status AS assignment_status,
                a.assigned_date,
                a.start_date,
                a.end_date,
                a.notes,

                cn.id AS need_id,
                cn.title AS need_title,
                cn.description AS need_description,
                cn.location AS need_location,
                cn.urgency,

                u.id AS volunteer_user_id,
                u.full_name AS volunteer_name,
                u.email AS volunteer_email,
                u.phone AS volunteer_phone,

                vp.id AS volunteer_profile_id,
                vp.location AS volunteer_location,
                vp.availability,

                s.skill_name,
                vs.experience_level

             FROM community_profiles cp

             INNER JOIN community_needs cn
                ON cn.community_member_id = cp.id

             INNER JOIN assignments a
                ON a.need_id = cn.id

             INNER JOIN volunteer_profiles vp
                ON vp.id = a.volunteer_id

             INNER JOIN users u
                ON u.id = vp.user_id

             LEFT JOIN volunteer_skills vs
                ON vs.volunteer_id = vp.id
             LEFT JOIN skills s
                ON s.id = vs.skill_id
                AND s.id = cn.required_skill_id

             WHERE cp.user_id = ?

             ORDER BY a.created_at DESC`,
            [req.user.id]
        );

        return res.status(200).json({
            success: true,
            message:
                "Assigned volunteer information retrieved successfully.",
            count: assignments.length,
            assignments
        });

    } catch (error) {
        console.error(
            "View assigned volunteer error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error while retrieving assigned volunteer information."
        });
    }
}


// =====================================================
// EXPORT FUNCTIONS
// =====================================================
module.exports = {
    createCommunityProfile,
    getCommunitySkills,
    createCommunityNeed,
    getCommunityNeeds,
    viewAvailableVolunteers,
    viewAssignedVolunteer
};
module.exports = {
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
};





