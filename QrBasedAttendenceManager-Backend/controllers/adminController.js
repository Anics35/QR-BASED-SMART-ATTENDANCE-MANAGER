const User = require("../models/userModel");
const Course = require("../models/course");
const Session = require("../models/session");
const Attendance = require("../models/attendance");

/**
 * Global System Stats
 */
exports.getSystemStats = async (req, res) => {
  try {
    const studentCount = await User.countDocuments({ role: "student" });
    const teacherCount = await User.countDocuments({ role: "teacher" });
    const courseCount = await Course.countDocuments();
    const sessionCount = await Session.countDocuments();
    const totalAttendance = await Attendance.countDocuments({ status: 'present' });

    res.status(200).json({
      studentCount,
      teacherCount,
      courseCount,
      sessionCount,
      totalAttendance
    });
  } catch (err) {
    res.status(500).json({ message: "Stats failed", error: err.message });
  }
};

/**
 * Get All Users (with filters)
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : { role: { $ne: 'admin' } };
    
    const users = await User.find(filter)
      .select('-googleId')
      .sort({ createdAt: -1 });
      
    res.status(200).json({ users });
  } catch (err) {
    res.status(500).json({ message: "Fetch failed", error: err.message });
  }
};

/**
 * Delete User (Cascade)
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Cleanup associated data
    if (user.role === 'teacher') {
        await Course.deleteMany({ teacherId: user._id });
        // Note: Sessions/Attendance linked to those courses are orphaned. 
        // Ideally, you'd find courses first, then delete their sessions.
    } else if (user.role === 'student') {
        await Attendance.deleteMany({ studentId: user._id });
        // Remove from enrolled lists
        await Course.updateMany(
            { enrolledStudents: user._id },
            { $pull: { enrolledStudents: user._id } }
        );
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed", error: err.message });
  }
};

/**
 * Get All Courses (Admin View)
 */
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('teacherId', 'name email')
      .sort({ createdAt: -1 });
    
    // Add student count to each
    const data = courses.map(c => ({
        _id: c._id,
        courseName: c.courseName,
        courseCode: c.courseCode,
        department: c.department,
        teacherName: c.teacherId?.name || "Unknown",
        studentCount: c.enrolledStudents.length
    }));

    res.status(200).json({ courses: data });
  } catch (err) {
    res.status(500).json({ message: "Fetch failed", error: err.message });
  }
};



/**
 * Get Detailed Stats for a Specific User (Student/Teacher)
 */
exports.getUserDetailsWithStats = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-googleId');
    if (!user) return res.status(404).json({ message: "User not found" });

    let stats = {};

    if (user.role === 'student') {
        // 1. Find all courses the student is enrolled in
        const courses = await Course.find({ enrolledStudents: id });

        const subjectWise = [];
        let totalClassesOverall = 0;
        let attendedClassesOverall = 0;

        for (const course of courses) {
            // A. Count total sessions conducted for this course
            const totalSessions = await Session.countDocuments({ courseId: course._id });

            // B. Count how many the student attended
            const attendedCount = await Attendance.countDocuments({
                courseId: course._id,
                studentId: id,
                status: 'present'
            });

            const percentage = totalSessions > 0 
                ? ((attendedCount / totalSessions) * 100).toFixed(1) 
                : "0.0";

            subjectWise.push({
                courseId: course._id,
                courseName: course.courseName,
                courseCode: course.courseCode,
                totalClasses: totalSessions,
                attendedClasses: attendedCount,
                percentage: percentage
            });

            totalClassesOverall += totalSessions;
            attendedClassesOverall += attendedCount;
        }

        const overallPercentage = totalClassesOverall > 0 
            ? ((attendedClassesOverall / totalClassesOverall) * 100).toFixed(1) 
            : "0.0";

        stats = {
            overallPercentage,
            totalClasses: totalClassesOverall,
            attendedClasses: attendedClassesOverall,
            subjectWise
        };

    } else if (user.role === 'teacher') {
        // 1. Find courses taught by this teacher
        const courses = await Course.find({ teacherId: id });

        const subjectWise = [];
        let totalSessionsHosted = 0;

        for (const course of courses) {
            // Count sessions created for this course
            const sessionCount = await Session.countDocuments({ courseId: course._id });
            
            subjectWise.push({
                courseId: course._id,
                courseName: course.courseName,
                courseCode: course.courseCode,
                totalSessions: sessionCount,
                studentCount: course.enrolledStudents.length
            });

            totalSessionsHosted += sessionCount;
        }

        stats = {
            totalSessionsHosted,
            courseCount: courses.length,
            subjectWise
        };
    }

    res.status(200).json({ user, stats });

  } catch (err) {
    console.error("Stats Error:", err);
    res.status(500).json({ message: "Failed to fetch user stats", error: err.message });
  }
};