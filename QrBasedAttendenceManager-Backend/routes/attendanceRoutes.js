const express = require("express");
const router = express.Router();
const verifyJWT = require("../middleware/verifyJWT");

// Importing specific functions
const { 
  markAttendance, 
  getStudentHistory, 
  getStudentCourseHistory,
  manualAttendance,
  markBulkAttendance, // ✅ Kept this
  getMyCourseHistory  // ✅ Added this
} = require("../controllers/attendanceController");

// 0. My Course History (Student App)
router.get("/history/course/:courseId", verifyJWT, getMyCourseHistory);

// 1. Mark Attendance (Student Scan)
router.post("/mark", verifyJWT, markAttendance);

// 2. Student History (For Mobile App)
router.get("/history", verifyJWT, getStudentHistory);

// 3. Teacher View: Specific Student History in a Course
router.get("/history/:courseId/:studentId", verifyJWT, getStudentCourseHistory);

// 4. Manual Attendance (Single Student Override)
router.post("/manual", verifyJWT, manualAttendance);

// 5. Bulk Manual Attendance
router.post("/bulk-manual", verifyJWT, markBulkAttendance);

// 0. My Course History (Student App)
router.get("/history/course/:courseId", verifyJWT, getMyCourseHistory);

module.exports = router;