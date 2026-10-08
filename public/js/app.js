const API_BASE = "http://127.0.0.1:3000";

document.addEventListener("DOMContentLoaded", function () {
    loadDashboard();
    displayCurrentDate();
});

async function loadDashboard() {
    const token = localStorage.getItem("cse_vms_token");

    if (!token) {
        window.location.href = "index.html";
        return;
    }

    try {
        const response = await fetch(
            API_BASE + "/api/reports/summary",
            {
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + token,
                    "Content-Type": "application/json"
                }
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || "Failed to load dashboard data."
            );
        }

        const report = data.report;

        updateElement("totalUsers", report.total_users);
        updateElement("totalVolunteers", report.total_volunteers);
        updateElement(
            "totalCommunityMembers",
            report.total_community_members
        );
        updateElement("totalSkills", report.total_skills);
        updateElement(
            "totalCoordinators",
            report.total_coordinators
        );
        updateElement(
            "totalAssignments",
            report.total_assignments
        );
        updateElement(
            "totalParticipations",
            report.total_participations
        );
        updateElement(
            "totalNotifications",
            report.total_notifications
        );

        updateElement("overviewUsers", report.total_users);
        updateElement(
            "overviewVolunteers",
            report.total_volunteers
        );
        updateElement(
            "overviewCommunity",
            report.total_community_members
        );
        updateElement("overviewSkills", report.total_skills);
        updateElement(
            "overviewNeeds",
            report.total_community_needs || 0
        );
        updateElement(
            "overviewAssignments",
            report.total_assignments
        );

    } catch (error) {
        console.error("Dashboard loading error:", error);
        showDashboardError(error.message);
    }
}

function updateElement(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value ?? 0;
    }
}

function displayCurrentDate() {
    const element = document.getElementById("currentDate");

    if (!element) {
        return;
    }

    const today = new Date();

    element.textContent = today.toLocaleDateString(
        "en-US",
        {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    );
}

function showDashboardError(message) {
    const status = document.querySelector(
        ".status-indicator"
    );

    if (status) {
        status.innerHTML =
            "<span class=\"status-dot\"></span>" +
            "<strong>" + message + "</strong>";
    }
}
