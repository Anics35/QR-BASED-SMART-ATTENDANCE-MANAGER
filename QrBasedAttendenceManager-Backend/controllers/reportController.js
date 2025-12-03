const mongoose = require("mongoose");
const Attendance = require("../models/attendance");
const Course = require("../models/course");
const Session = require("../models/session");
const User = require("../models/userModel");

/**
 * Helper: Get Attendance Map for a Course
 * Returns: { 'studentId': count }
 */
async function getAttendanceMap(courseId) {
  const counts = await Attendance.aggregate([
    { $match: { 
        courseId: new mongoose.Types.ObjectId(courseId), 
        status: "present" 
    }},
    { $group: { _id: "$studentId", count: { $sum: 1 } } }
  ]);
  
  // Convert to easy lookup object
  const map = {};
  counts.forEach(c => { map[c._id.toString()] = c.count; });
  return map;
}

/**
 * 1. Student Monthly Report
 * Shows ALL enrolled courses, even if 0 attendance
 */
exports.studentMonthlyReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    const studentId = req.user.id;

    // 1. Find courses student is enrolled in
    const enrolledCourses = await Course.find({ enrolledStudents: studentId });

    const report = await Promise.all(enrolledCourses.map(async (course) => {
        // 2. Count Total Sessions held in this month
        const totalSessions = await Session.countDocuments({
            courseId: course._id,
            sessionDate: {
                $gte: new Date(year, month - 1, 1),
                $lte: new Date(year, month, 0),
            }
        });

        // 3. Count Student's Attendance in this month
        const attended = await Attendance.countDocuments({
            courseId: course._id,
            studentId: studentId,
            status: 'present',
            timestamp: {
                $gte: new Date(year, month - 1, 1),
                $lte: new Date(year, month, 0),
            }
        });

        return {
            courseId: course._id,
            courseName: course.courseName,
            totalSessions,
            attended,
            percentage: totalSessions > 0 ? ((attended / totalSessions) * 100).toFixed(1) : "0.0",
            lateCount: 0
        };
    }));

    // Filter out inactive courses (0 sessions held) to keep view clean? 
    // Or keep them to show "No classes"? Let's keep them.
    return res.status(200).json({ studentId, month, year, report });
  } catch (err) {
    res.status(500).json({ message: "Report failed", error: err.message });
  }
};

/**
 * 2. Course-wise report (Teacher Consolidated View)
 * LISTS ALL ENROLLED STUDENTS (Even with 0% Attendance)
 */
exports.courseWiseReport = async (req, res) => {
  try {
    const { courseId } = req.params;

    // 1. Get Course & Enrolled Students
    const course = await Course.findById(courseId).populate('enrolledStudents', 'name rollNumber email');
    if (!course) return res.status(404).json({ message: "Course not found" });

    // 2. Get Real Total Sessions (Denominator)
    const totalSessionsHeld = await Session.countDocuments({ courseId });

    // 3. Get Attendance Counts (Numerator)
    const attendanceMap = await getAttendanceMap(courseId);

    // 4. Build List
    const report = course.enrolledStudents.map(student => {
        const attended = attendanceMap[student._id.toString()] || 0; // 0 if never attended
        const percent = totalSessionsHeld > 0 
            ? ((attended / totalSessionsHeld) * 100).toFixed(1) 
            : "0.0";

        return {
            studentId: student._id,
            name: student.name,
            rollNumber: student.rollNumber,
            email: student.email,
            totalSessions: totalSessionsHeld,
            attended: attended,
            percentage: percent
        };
    });

    // 5. Sort by Roll Number
    report.sort((a, b) => (a.rollNumber || "").localeCompare(b.rollNumber || ""));

    return res.status(200).json({ courseId, report });
  } catch (err) {
    console.error("Report Error:", err);
    res.status(500).json({ message: "Failed to generate report", error: err.message });
  }
};

/**
 * 3. Student Semester Report
 * Shows ALL enrolled courses
 */
exports.semesterReport = async (req, res) => {
  try {
    const { semester } = req.query;
    const studentId = req.user.id;
    const targetSemester = semester || "Autumn";

    // 1. Find Enrolled Courses matching Semester
    const courses = await Course.find({ 
        enrolledStudents: studentId,
        semester: targetSemester 
    });

    // 2. Calculate Stats for each
    const report = await Promise.all(courses.map(async (course) => {
        const totalSessions = await Session.countDocuments({ courseId: course._id });
        const attended = await Attendance.countDocuments({ 
            courseId: course._id, 
            studentId: studentId, 
            status: 'present' 
        });

        return {
            courseId: course._id,
            courseName: course.courseName,
            courseCode: course.courseCode,
            totalSessions,
            attended,
            percentage: totalSessions > 0 ? ((attended / totalSessions) * 100).toFixed(1) : "0.0"
        };
    }));

    return res.status(200).json({
        studentId,
        semester: targetSemester,
        report
    });
  } catch (err) {
    res.status(500).json({ message: "Report failed", error: err.message });
  }
};

/**
 * 4. Single Course Stat (For specific student request)
 */
exports.studentCourseReport = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { courseId } = req.params;

    const totalSessions = await Session.countDocuments({ courseId });
    const attended = await Attendance.countDocuments({ courseId, studentId, status: 'present' });

    return res.status(200).json({
      studentId,
      courseId,
      totalSessions,
      attended,
      percentage: totalSessions > 0 ? ((attended / totalSessions) * 100).toFixed(1) : "0.0",
      lateCount: 0
    });
  } catch (err) {
    res.status(500).json({ message: "Report failed", error: err.message });
  }
};

/**
 * 5. Export CSV (Full Roster)
 */
exports.exportCourseAttendance = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Get Course & Students
    const course = await Course.findById(courseId).populate('enrolledStudents', 'name rollNumber email');
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Get Data
    const totalSessions = await Session.countDocuments({ courseId });
    const attendanceMap = await getAttendanceMap(courseId);

    // Build CSV
    let csv = "Roll Number,Student Name,Email,Attended,Total,Percentage\n";
    
    course.enrolledStudents.forEach(student => {
        const attended = attendanceMap[student._id.toString()] || 0;
        const percent = totalSessions > 0 ? ((attended / totalSessions) * 100).toFixed(1) : "0.0";
        
        csv += `"${student.rollNumber}","${student.name}","${student.email}",${attended},${totalSessions},${percent}%\n`;
    });

    res.header("Content-Type", "text/csv");
    res.attachment(`${course.courseName}_Report.csv`);
    return res.status(200).send(csv);

  } catch (err) {
    res.status(500).json({ message: "Export failed", error: err.message });
  }
};