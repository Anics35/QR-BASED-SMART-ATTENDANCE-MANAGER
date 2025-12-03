const Course = require("../models/course");
const User = require("../models/userModel");
const Session = require("../models/session"); // <--- Added
const Attendance = require("../models/attendance"); // <--- Added
const logAction = require("../middleware/logAction");

/**
 * Create a new course (teacher or admin)
 */
exports.createCourse = async (req, res) => {
  try {
    const {
      courseCode,
      courseName,
      semester,
      year,
      department,
      location,
    } = req.body;

    const teacherId = req.user.id;

    if (!courseCode || !courseName) {
        return res.status(400).json({ message: "Course Code and Name are required" });
    }

    const course = await Course.create({
      courseCode,
      courseName,
      semester,
      year,
      department,
      teacherId,
      location: location || { room: "TBD", coordinates: { latitude: 0, longitude: 0 } },
    });

    await logAction({
      userId: teacherId,
      action: "course_created",
      entityType: "course",
      entityId: course._id,
      details: { courseCode },
      ip: req.ip,
    });

    return res.status(201).json({
      message: "Course created successfully",
      course,
    });
  } catch (err) {
    console.error("Create Course Error:", err);
    if (err.code === 11000) {
        return res.status(400).json({ message: "Course Code already exists!" });
    }
    res.status(500).json({ message: "Failed to create course", error: err.message });
  }
};

/**
 * Update course details
 */
exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await Course.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updated) return res.status(404).json({ message: "Course not found" });

    await logAction({
      userId: req.user.id,
      action: "course_updated",
      entityType: "course",
      entityId: updated._id,
      details: req.body,
      ip: req.ip,
    });

    return res.status(200).json({
      message: "Course updated successfully",
      course: updated,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to update course", error: err.message });
  }
};

/**
 * Delete Course (Cascading)
 */
exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Delete Course
    const course = await Course.findByIdAndDelete(id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // 2. Delete related Sessions & Attendance
    await Session.deleteMany({ courseId: id });
    await Attendance.deleteMany({ courseId: id });

    // 3. Log it
    await logAction({
      userId: req.user.id,
      action: "course_deleted",
      entityType: "course",
      entityId: course._id,
      details: { courseName: course.courseName },
      ip: req.ip,
    });

    return res.status(200).json({ message: "Course deleted successfully" });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ message: "Delete failed", error: err.message });
  }
};

/**
 * Enroll a student
 */
exports.enrollStudent = async (req, res) => {
  try {
    const { courseId, studentId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const student = await User.findById(studentId);
    if (!student || student.role !== "student") {
      return res.status(400).json({ message: "Invalid student" });
    }

    if (course.enrolledStudents.includes(studentId)) {
      return res.status(400).json({ message: "Student already enrolled" });
    }

    course.enrolledStudents.push(studentId);
    await course.save();

    await logAction({
      userId: req.user.id,
      action: "student_enrolled",
      entityType: "course",
      entityId: courseId,
      details: { studentId },
      ip: req.ip,
    });

    return res.status(200).json({ message: "Student enrolled successfully", course });
  } catch (err) {
    res.status(500).json({ message: "Enrollment failed", error: err.message });
  }
};

/**
 * Get all courses for teacher
 */
exports.getTeacherCourses = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const courses = await Course.find({ teacherId });
    return res.status(200).json({ courses });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch courses", error: err.message });
  }
};

/**
 * Get courses for student
 */
exports.getStudentCourses = async (req, res) => {
  try {
    const studentId = req.user.id;
    const courses = await Course.find({ enrolledStudents: studentId });
    return res.status(200).json({ courses });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch student courses", error: err.message });
  }
};

/**
 * Get course by ID
 */
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    return res.status(200).json({ course });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch course", error: err.message });
  }
};




/**
 * Student joins a course using Course Code (e.g. "CSB401")
 */
exports.joinCourse = async (req, res) => {
  try {
    const { courseCode } = req.body;
    const studentId = req.user.id; // From JWT

    // 1. Find Course
    const course = await Course.findOne({ courseCode: courseCode.toUpperCase() });
    if (!course) {
      return res.status(404).json({ message: "Invalid Course Code" });
    }

    // 2. Check if already enrolled
    if (course.enrolledStudents.includes(studentId)) {
      return res.status(400).json({ message: "You are already enrolled in this course" });
    }

    // 3. Enroll
    course.enrolledStudents.push(studentId);
    await course.save();

    await logAction({
      userId: studentId,
      action: "student_enrolled",
      entityType: "course",
      entityId: course._id,
      details: { courseCode },
      ip: req.ip,
    });

    return res.status(200).json({ 
      message: `Successfully joined ${course.courseName}`,
      course 
    });

  } catch (err) {
    res.status(500).json({ message: "Join failed", error: err.message });
  }
};

/**
 * Get list of students enrolled in a course
 */
exports.getEnrolledStudents = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id).populate({
      path: 'enrolledStudents',
      select: 'name rollNumber email photoUrl' // Only fetch needed fields
    });

    if (!course) return res.status(404).json({ message: "Course not found" });

    return res.status(200).json({ 
      courseName: course.courseName,
      students: course.enrolledStudents 
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch students", error: err.message });
  }
};