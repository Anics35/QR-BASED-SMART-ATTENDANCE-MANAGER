const express = require("express");
const router = express.Router();

const {
  createCourse,
  updateCourse,
  enrollStudent,
  getTeacherCourses,
  getStudentCourses,
  getCourseById,
  deleteCourse, // <--- 1. ENSURE IMPORT
  joinCourse,
  getEnrolledStudents
  

} = require("../controllers/courseController");

const verifyJWT = require("../middleware/verifyJWT");

// Teacher/Admin creates course
router.post("/create", verifyJWT, createCourse);

// Update course
router.put("/:id", verifyJWT, updateCourse);

// --- 2. ADD THIS MISSING ROUTE ---
router.delete("/:id", verifyJWT, deleteCourse); 

// Enroll student
router.post("/enroll", verifyJWT, enrollStudent);

// Fetch teacher courses
router.get("/teacher", verifyJWT, getTeacherCourses);

// Fetch student courses
router.get("/student", verifyJWT, getStudentCourses);

// Fetch single course
router.get("/:id", verifyJWT, getCourseById);

// NEW: Student Join Route
router.post("/join", verifyJWT, joinCourse);

router.get("/:id/students", verifyJWT, getEnrolledStudents);

module.exports = router;