const express = require("express");
const router = express.Router();
const { getSystemStats, getAllUsers, deleteUser , getAllCourses, getUserDetailsWithStats} = require("../controllers/adminController");
const verifyJWT = require("../middleware/verifyJWT");
const verifyAdmin = require("../middleware/verifyAdmin");

// Protect ALL routes with JWT + Admin Check
router.use(verifyJWT);
router.use(verifyAdmin);

router.get("/stats", getSystemStats);
router.get("/users", getAllUsers);
router.delete("/users/:id", deleteUser);
router.get("/courses", getAllCourses); 
router.get("/users/:id/stats", getUserDetailsWithStats);

module.exports = router;