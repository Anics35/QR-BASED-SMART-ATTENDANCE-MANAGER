const mongoose = require("mongoose"); 
const Attendance = require("../models/attendance");
const Session = require("../models/session");
const User = require("../models/userModel");
const Course = require("../models/course"); // Required for Enrollment Check
const AuditLog = require("../models/auditLog");
const logAction = require("../middleware/logAction");

/**
 * Haversine formula for distance (in meters)
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const toRad = (v) => (v * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // distance in meters
};

/**
 * Helper: Create audit log entry
 */
async function logAudit(userId, action, entityType, entityId, details) {
  await AuditLog.create({
    userId,
    action,
    entityType,
    entityId,
    details,
    ipAddress: "0.0.0.0",
  });
}

/**
 * 1. Mark attendance for student (Scan QR)
 */
exports.markAttendance = async (req, res) => {
  try {
    const { sessionId, qrToken, latitude, longitude } = req.body;
    const studentId = req.user.id; 
    const deviceId = req.user.deviceId; 

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });

    // --- ENROLLMENT CHECK ---
    const course = await Course.findById(session.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (!course.enrolledStudents.includes(studentId)) {
        await logAudit(studentId, "unauthorized_attempt", "course", course._id, {
            message: "Student tried to mark attendance without enrollment"
        });
        return res.status(403).json({ message: "Access Denied: You are not enrolled in this course." });
    }
    // ------------------------

    // Validate Session Status
    if (session.status !== "active") {
      return res.status(400).json({ message: "Session is not active" });
    }

    // Validate QR token
    if (
      session.qrCode.sessionToken !== qrToken ||
      session.qrCode.isValid === false
    ) {
      return res.status(400).json({ message: "Invalid or expired QR token" });
    }

    // Check QR expiry
    if (new Date() > session.qrCode.expiresAt) {
      return res.status(400).json({ message: "QR Code has expired" });
    }

    // Validate registered device
    const user = await User.findById(studentId);
    if (!user || user.deviceId !== deviceId) {
      return res.status(403).json({ message: "Device mismatch. Please use your registered phone." });
    }

    // Validate location radius
    const requiredLat = session.location.latitude;
    const requiredLon = session.location.longitude;
    const requiredRadius = session.location.radius;

    const distance = calculateDistance(latitude, longitude, requiredLat, requiredLon);

    if (distance > requiredRadius) {
      return res.status(403).json({
        message: "You are outside the allowed classroom radius",
        distance: Math.round(distance) + "m"
      });
    }

    // Check duplicate attendance
    const existing = await Attendance.findOne({ sessionId, studentId });
    if (existing) {
      return res.status(400).json({ message: "Attendance already marked" });
    }

    // Save attendance
    const attendance = await Attendance.create({
      sessionId,
      courseId: session.courseId,
      studentId,
      status: "present",
      deviceValidation: { deviceId, isValidDevice: true },
      locationValidation: {
        studentLatitude: latitude,
        studentLongitude: longitude,
        distance,
        isWithinRadius: true,
      },
      qrValidation: { sessionToken: qrToken, isValid: true },
      metadata: {
        platform: req.body.platform || "mobile",
        appVersion: "1.0.0",
      },
    });

    await logAction({
      userId: studentId,
      action: "attendance_marked",
      entityType: "attendance",
      entityId: attendance._id,
      details: { outcome: "success", distance },
      ip: req.ip,
    });

    return res.status(200).json({
      message: "Attendance marked successfully",
      attendanceId: attendance._id,
    });
  } catch (err) {
    console.error("Attendance Error:", err);
    res.status(500).json({ message: "Attendance failed", error: err.message });
  }
};

/**
 * 2. Manual Attendance (Teacher Override)
 */
/**
 * 2. Manual Attendance (Teacher Override) - FIXED with Enrollment Check
 */
exports.manualAttendance = async (req, res) => {
  try {
    const { sessionId, email } = req.body;
    
    // 1. Find student
    const student = await User.findOne({ email: email.toLowerCase() });
    if (!student) return res.status(404).json({ message: "Student email not found" });

    // 2. Find Session
    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });

    // --- NEW: ENROLLMENT CHECK ---
    const course = await Course.findById(session.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Ensure student is in the enrolled list
    if (!course.enrolledStudents.includes(student._id)) {
        return res.status(403).json({ 
            message: "Action Failed: This student is NOT enrolled in the course." 
        });
    }
    // -----------------------------

    // 3. Check Duplicate
    const existing = await Attendance.findOne({ sessionId, studentId: student._id });
    if (existing) return res.status(400).json({ message: "Student is already marked present" });

    // 4. Create Record
    await Attendance.create({
      sessionId,
      courseId: session.courseId,
      studentId: student._id,
      status: "present",
      deviceValidation: { deviceId: "MANUAL_OVERRIDE", isValidDevice: true },
      locationValidation: { studentLatitude: 0, studentLongitude: 0, distance: 0, isWithinRadius: true },
      qrValidation: { sessionToken: "MANUAL", isValid: true },
    });

    await logAction({
      userId: req.user.id,
      action: "attendance_marked",
      entityType: "attendance",
      entityId: session._id,
      details: { outcome: "manual_override", studentEmail: email },
      ip: req.ip,
    });

    return res.status(200).json({ message: "Student marked present manually" });
  } catch (err) {
    res.status(500).json({ message: "Manual marking failed", error: err.message });
  }
};
/**
 * 3. Get Student's Own History (Mobile App)
 */
exports.getStudentHistory = async (req, res) => {
  try {
    const studentId = req.user.id;
    const history = await Attendance.find({ studentId })
      .populate('courseId', 'courseName courseCode')
      .populate('sessionId', 'sessionDate sessionType')
      .sort({ timestamp: -1 });

    return res.status(200).json(history);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch history", error: err.message });
  }
};

/**
 * 4. Get Detailed Timeline for a Student in a Course (Teacher Report)
 */
exports.getStudentCourseHistory = async (req, res) => {
  try {
    const { studentId, courseId } = req.params;

    // Get ALL sessions for this course
    const allSessions = await Session.find({ courseId }).sort({ sessionDate: -1 });

    // Get ALL attendance for this student in this course
    const studentAttendance = await Attendance.find({ studentId, courseId });

    // Merge to find Absentees
    const history = allSessions.map((session) => {
      const record = studentAttendance.find(
        (a) => a.sessionId.toString() === session._id.toString()
      );

      return {
        sessionId: session._id,
        date: session.sessionDate,
        status: record ? record.status : "absent",
        markedAt: record ? record.timestamp : null,
        device: record ? record.deviceValidation?.deviceId : "N/A"
      };
    });

    return res.status(200).json({ history });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch detailed history", error: err.message });
  }
};


/**
 * 5. Bulk Manual Attendance (Select Multiple Students)
 */
exports.markBulkAttendance = async (req, res) => {
  try {
    const { sessionId, studentIds } = req.body;

    // 1. Find Session
    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });

    // 2. Validate Students
    const students = await User.find({ _id: { $in: studentIds }, role: 'student' });
    if (students.length === 0) return res.status(400).json({ message: "No valid students found" });

    // 3. Loop and Mark Attendance
    let markedCount = 0;
    
    for (const student of students) {
        // Check duplicate
        const existing = await Attendance.findOne({ sessionId, studentId: student._id });
        if (existing) continue; // Skip if already present

        // Create Record
        await Attendance.create({
            sessionId,
            courseId: session.courseId,
            studentId: student._id,
            status: "present",
            deviceValidation: { deviceId: "MANUAL_BULK", isValidDevice: true },
            locationValidation: { studentLatitude: 0, studentLongitude: 0, distance: 0, isWithinRadius: true },
            qrValidation: { sessionToken: "MANUAL_BULK", isValid: true },
        });

        // Optional: Log action (can be commented out for performance if marking 50+ students)
        // await logAction({ ... });
        markedCount++;
    }

    return res.status(200).json({ message: `Successfully marked ${markedCount} students present.` });

  } catch (err) {
    console.error("Bulk Mark Error:", err);
    res.status(500).json({ message: "Bulk marking failed", error: err.message });
  }
};

/**
 * 6. Get My History for a Specific Course (Student App)
 */
exports.getMyCourseHistory = async (req, res) => {
  try {
    console.log("➡️  Received History Request");

    // 1. Safety Check: Is User Authenticated?
    if (!req.user || !req.user.id) {
        console.error("❌ Error: req.user is undefined. Middleware missing?");
        return res.status(401).json({ message: "Unauthorized" });
    }
    
    const studentId = req.user.id;
    const { courseId } = req.params;

    console.log(`👤 Student: ${studentId}, 📚 Course: ${courseId}`);

    // 2. Safety Check: Is CourseID valid?
    if (!courseId || courseId === 'undefined' || !mongoose.Types.ObjectId.isValid(courseId)) {
        console.error("❌ Error: Invalid Course ID format");
        return res.status(400).json({ message: "Invalid Course ID provided" });
    }

    // 3. Fetch Data
    const allSessions = await Session.find({ courseId }).sort({ sessionDate: -1 });
    
    // If no sessions, return empty immediately
    if (!allSessions || allSessions.length === 0) {
        return res.status(200).json({ history: [] });
    }

    const studentAttendance = await Attendance.find({ studentId, courseId });

    // 4. Map Results
    const history = allSessions.map((session) => {
      const record = studentAttendance.find(
        (a) => a.sessionId.toString() === session._id.toString()
      );

      return {
        _id: session._id,
        date: session.sessionDate,
        status: record ? "present" : "absent",
        markedAt: record ? record.timestamp : null,
        duration: session.duration || 60
      };
    });

    console.log(`✅ Found ${history.length} history records`);
    return res.status(200).json({ history });

  } catch (err) {
    console.error("🔥 CRITICAL SERVER ERROR:", err);
    // This prevents the app from hanging, sending a proper error response
    return res.status(500).json({ message: "Server Error", error: err.message });
  }
};