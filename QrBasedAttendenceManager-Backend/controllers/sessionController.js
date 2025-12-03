const mongoose = require("mongoose"); // <--- ADD THIS LINE
const crypto = require("crypto");
const Session = require("../models/session");
const Attendance = require("../models/attendance"); // <--- Verified Import
const logAction = require("../middleware/logAction");

/**
 * Generate a secure session token (used inside QR)
 */
const generateSessionToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Teacher creates a session
 */
exports.createSession = async (req, res) => {
  try {
    const { courseId, latitude, longitude, radius, duration } = req.body;
    const teacherId = req.user.id; // from JWT middleware

    const sessionToken = generateSessionToken();
    const now = Date.now();
    const expires = new Date(now + 30 * 1000); // 30 sec expiry

    const session = await Session.create({
      courseId,
      teacherId,
      duration,
      location: {
        latitude,
        longitude,
        radius,
      },
      qrCode: {
        sessionToken,
        generatedAt: now,
        expiresAt: expires,
        isValid: true,
      },
    });

    await logAction({
      userId: teacherId,
      action: "session_created",
      entityType: "session",
      entityId: session._id,
      details: { courseId },
      ip: req.ip,
    });

    return res.status(201).json({
      message: "Session created successfully",
      sessionId: session._id,
      qrToken: session.qrCode.sessionToken,
      expiresAt: session.qrCode.expiresAt,
    });
  } catch (err) {
    console.error("Create Session Error:", err);
    res.status(500).json({ message: "Failed to create session", error: err.message });
  }
};

/**
 * Get QR information for a session
 */
exports.getQR = async (req, res) => {
  try {
    const sessionId = req.params.id;

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });

    return res.status(200).json({
      qrToken: session.qrCode.sessionToken,
      expiresAt: session.qrCode.expiresAt,
      isValid: session.qrCode.isValid,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch QR", error: err.message });
  }
};

/**
 * Refresh QR every 15–30 seconds
 */
exports.refreshQR = async (req, res) => {
  try {
    const sessionId = req.params.id;

    const newToken = generateSessionToken();
    const now = Date.now();
    const newExpiry = new Date(now + 30 * 1000);

    const updated = await Session.findByIdAndUpdate(
      sessionId,
      {
        $set: {
          "qrCode.sessionToken": newToken,
          "qrCode.generatedAt": now,
          "qrCode.expiresAt": newExpiry,
          "qrCode.isValid": true,
        },
      },
      { new: true }
    );

    // Optional: Log every refresh? Might be too noisy.
    // await logAction({ ... });

    return res.status(200).json({
      message: "QR refreshed",
      qrToken: updated.qrCode.sessionToken,
      expiresAt: updated.qrCode.expiresAt,
    });
  } catch (err) {
    res.status(500).json({ message: "QR refresh failed", error: err.message });
  }
};

/**
 * Invalidate QR after time expires or session ends
 */
exports.invalidateQR = async (sessionId) => {
  await Session.findByIdAndUpdate(sessionId, {
    $set: { "qrCode.isValid": false }
  });
};

/**
 * Get live attendees for a specific session
 */
exports.getSessionAttendees = async (req, res) => {
  try {
    const { id } = req.params; // Session ID
    
    // Find all attendance records for this session
    // Make sure 'studentId' matches the ref in your Attendance Schema
    const attendees = await Attendance.find({ sessionId: id })
      .populate('studentId', 'name rollNumber email') 
      .sort({ timestamp: -1 });

    return res.status(200).json(attendees);
  } catch (err) {
    console.error("Error fetching attendees:", err); // Log to terminal
    res.status(500).json({ message: "Failed to fetch attendees", error: err.message });
  }
};


/**
 * Get all sessions for a course with attendee counts
 */
exports.getSessionsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const sessions = await Session.aggregate([
      // 1. Find sessions for this course
      { $match: { courseId: new mongoose.Types.ObjectId(courseId) } },
      
      // 2. Lookup attendance count
      {
        $lookup: {
          from: "attendances",
          localField: "_id",
          foreignField: "sessionId",
          as: "attendanceRecords"
        }
      },

      // 3. Format Output
      {
        $project: {
          _id: 1,
          sessionDate: 1,
          duration: 1,
          status: 1,
          attendeeCount: { $size: "$attendanceRecords" } // Count array size
        }
      },

      // 4. Sort newest first
      { $sort: { sessionDate: -1 } }
    ]);

    return res.status(200).json({ sessions });
  } catch (err) {
    console.error("Session List Error:", err);
    res.status(500).json({ message: "Failed to fetch sessions", error: err.message });
  }
};