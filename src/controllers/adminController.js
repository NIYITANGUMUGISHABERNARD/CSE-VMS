const db = require("../config/database");


// =====================================================
// GET ALL SKILLS
// =====================================================
async function getSkills(req, res) {
    try {
        const [skills] = await db.execute(`
            SELECT
                id,
                skill_name,
                description,
                created_at
            FROM skills
            ORDER BY skill_name ASC
        `);

        return res.status(200).json({
            success: true,
            message: "Skills retrieved successfully.",
            count: skills.length,
            skills
        });

    } catch (error) {
        console.error("Get skills error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while retrieving skills."
        });
    }
}


// =====================================================
// CREATE SKILL
// =====================================================
async function createSkill(req, res) {
    try {
        const { skill_name, description } = req.body;

        if (!skill_name || !description) {
            return res.status(400).json({
                success: false,
                message: "Skill name and description are required."
            });
        }

        const skillName = skill_name.trim();
        const skillDescription = description.trim();

        if (skillName === "" || skillDescription === "") {
            return res.status(400).json({
                success: false,
                message: "Skill name and description cannot be empty."
            });
        }

        const [existingSkills] = await db.execute(
            `SELECT id FROM skills WHERE skill_name = ?`,
            [skillName]
        );

        if (existingSkills.length > 0) {
            return res.status(409).json({
                success: false,
                message: "A skill with this name already exists."
            });
        }

        const [result] = await db.execute(
            `INSERT INTO skills (skill_name, description)
             VALUES (?, ?)`,
            [skillName, skillDescription]
        );

        await db.execute(
            `INSERT INTO activity_logs
                (user_id, action, description)
             VALUES (?, ?, ?)`,
            [
                req.user.id,
                "CREATE_SKILL",
                `Created skill: ${skillName}.`
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Skill created successfully.",
            skill: {
                id: result.insertId,
                skill_name: skillName,
                description: skillDescription
            }
        });

    } catch (error) {
        console.error("Create skill error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while creating skill."
        });
    }
}


// =====================================================
// UPDATE SKILL
// =====================================================
async function updateSkill(req, res) {
    try {
        const skillId = Number(req.params.id);
        const { skill_name, description } = req.body;

        if (!skillId || skillId <= 0) {
            return res.status(400).json({
                success: false,
                message: "A valid skill ID is required."
            });
        }

        if (!skill_name || !description) {
            return res.status(400).json({
                success: false,
                message: "Skill name and description are required."
            });
        }

        const skillName = skill_name.trim();
        const skillDescription = description.trim();

        if (skillName === "" || skillDescription === "") {
            return res.status(400).json({
                success: false,
                message: "Skill name and description cannot be empty."
            });
        }

        const [skills] = await db.execute(
            `SELECT id, skill_name
             FROM skills
             WHERE id = ?`,
            [skillId]
        );

        if (skills.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Skill not found."
            });
        }

        const [duplicateSkills] = await db.execute(
            `SELECT id
             FROM skills
             WHERE skill_name = ?
               AND id <> ?`,
            [skillName, skillId]
        );

        if (duplicateSkills.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Another skill with this name already exists."
            });
        }

        await db.execute(
            `UPDATE skills
             SET skill_name = ?,
                 description = ?
             WHERE id = ?`,
            [skillName, skillDescription, skillId]
        );

        await db.execute(
            `INSERT INTO activity_logs
                (user_id, action, description)
             VALUES (?, ?, ?)`,
            [
                req.user.id,
                "UPDATE_SKILL",
                `Updated skill ID ${skillId}: ${skillName}.`
            ]
        );

        return res.status(200).json({
            success: true,
            message: "Skill updated successfully.",
            skill: {
                id: skillId,
                skill_name: skillName,
                description: skillDescription
            }
        });

    } catch (error) {
        console.error("Update skill error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while updating skill."
        });
    }
}


// =====================================================
// DELETE SKILL
// =====================================================
async function deleteSkill(req, res) {
    try {
        const skillId = Number(req.params.id);

        if (!skillId || skillId <= 0) {
            return res.status(400).json({
                success: false,
                message: "A valid skill ID is required."
            });
        }

        const [skills] = await db.execute(
            `SELECT id, skill_name
             FROM skills
             WHERE id = ?`,
            [skillId]
        );

        if (skills.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Skill not found."
            });
        }

        const skillName = skills[0].skill_name;

        const [volunteerSkills] = await db.execute(
            `SELECT COUNT(*) AS total
             FROM volunteer_skills
             WHERE skill_id = ?`,
            [skillId]
        );

        if (volunteerSkills[0].total > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "This skill cannot be deleted because it is currently assigned to one or more volunteers."
            });
        }

        const [communityNeeds] = await db.execute(
            `SELECT COUNT(*) AS total
             FROM community_needs
             WHERE required_skill_id = ?`,
            [skillId]
        );

        if (communityNeeds[0].total > 0) {
            return res.status(409).json({
                success: false,
                message:
                    "This skill cannot be deleted because it is currently required by one or more community needs."
            });
        }

        await db.execute(
            `DELETE FROM skills WHERE id = ?`,
            [skillId]
        );

        await db.execute(
            `INSERT INTO activity_logs
                (user_id, action, description)
             VALUES (?, ?, ?)`,
            [
                req.user.id,
                "DELETE_SKILL",
                `Deleted skill: ${skillName}.`
            ]
        );

        return res.status(200).json({
            success: true,
            message: "Skill deleted successfully."
        });

    } catch (error) {
        console.error("Delete skill error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while deleting skill."
        });
    }
}


// =====================================================
// GET ALL COMMUNITY NEEDS
// =====================================================
async function getCommunityNeeds(req, res) {
    try {
        const [needs] = await db.execute(`
            SELECT
                cn.id,
                cn.title,
                cn.description,
                cn.location,
                cn.urgency,
                cn.status,
                cn.created_at,
                u.id AS community_member_id,
                u.full_name AS community_member_name,
                u.email AS community_member_email,
                u.phone AS community_member_phone,
                s.id AS required_skill_id,
                s.skill_name
            FROM community_needs cn
            INNER JOIN users u
                ON u.id = cn.community_member_id
            INNER JOIN skills s
                ON s.id = cn.required_skill_id
            ORDER BY cn.created_at DESC
        `);

        return res.status(200).json({
            success: true,
            message: "Community needs retrieved successfully.",
            count: needs.length,
            needs
        });

    } catch (error) {
        console.error("Get community needs error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while retrieving community needs."
        });
    }
}


module.exports = {
    getSkills,
    createSkill,
    updateSkill,
    deleteSkill,
    getCommunityNeeds
};
