const express = require("express");
const router = express.Router();
const { 
  markAttendance, 
  getStudentHistory, 
  getStudentCourseHistory ,// <--- Import this
  manualAttendance // <--- Import
} = require("../controllers/attendanceController");

const verifyJWT = require("../middleware/verifyJWT");

router.post("/mark", verifyJWT, markAttendance);
router.get("/history", verifyJWT, getStudentHistory); // Student's own history

// NEW: Teacher viewing a specific student
router.get("/history/:courseId/:studentId", verifyJWT, getStudentCourseHistory);

router.post("/manual", verifyJWT, manualAttendance);

module.exports = router;