const express = require("express");

const {
    authenticateToken
} = require("../middleware/authMiddleware");

const {
    requirePermission
} = require("../middleware/permissionMiddleware");

const {
    createUser,
    getUsers,
    getUserById,
    updateUser,
    changeUserRole,
    activateUser,
    deactivateUser
} = require("../controllers/userController");

const router = express.Router();


/*
|--------------------------------------------------------------------------
| CREATE USER
|--------------------------------------------------------------------------
*/
router.post(
    "/",
    authenticateToken,
    requirePermission("CREATE_USER"),
    createUser
);


/*
|--------------------------------------------------------------------------
| GET ALL USERS
|--------------------------------------------------------------------------
*/
router.get(
    "/",
    authenticateToken,
    requirePermission("CREATE_USER"),
    getUsers
);


/*
|--------------------------------------------------------------------------
| GET ONE USER
|--------------------------------------------------------------------------
*/
router.get(
    "/:id",
    authenticateToken,
    requirePermission("CREATE_USER"),
    getUserById
);


/*
|--------------------------------------------------------------------------
| UPDATE USER
|--------------------------------------------------------------------------
*/
router.put(
    "/:id",
    authenticateToken,
    requirePermission("CREATE_USER"),
    updateUser
);


/*
|--------------------------------------------------------------------------
| CHANGE USER ROLE
|--------------------------------------------------------------------------
*/
router.put(
    "/:id/role",
    authenticateToken,
    requirePermission("CREATE_USER"),
    changeUserRole
);


/*
|--------------------------------------------------------------------------
| ACTIVATE USER
|--------------------------------------------------------------------------
*/
router.put(
    "/:id/activate",
    authenticateToken,
    requirePermission("CREATE_USER"),
    activateUser
);


/*
|--------------------------------------------------------------------------
| DEACTIVATE USER
|--------------------------------------------------------------------------
*/
router.put(
    "/:id/deactivate",
    authenticateToken,
    requirePermission("CREATE_USER"),
    deactivateUser
);


module.exports = router;