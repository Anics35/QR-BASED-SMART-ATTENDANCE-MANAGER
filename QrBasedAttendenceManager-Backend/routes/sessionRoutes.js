const express = require("express");
const router = express.Router();

// 1. IMPORT the function here (It was missing in your uploaded file)
const {
  createSession,
  getQR,
  refreshQR,
  getSessionAttendees , // <--- MAKE SURE THIS IS HERE
  getSessionsByCourse
} = require("../controllers/sessionController");

const verifyJWT = require("../middleware/verifyJWT"); 

// Teacher creates a session
router.post("/create", verifyJWT, createSession);

// Get QR details for mobile app
router.get("/:id/qr", verifyJWT, getQR);

// Refresh QR every 15–30 seconds
router.post("/:id/refresh", verifyJWT, refreshQR);

// 2. ADD THIS ROUTE (This is the missing link!)
router.get("/:id/attendees", verifyJWT, getSessionAttendees);

router.get("/course/:courseId", verifyJWT, getSessionsByCourse);

module.exports = router;