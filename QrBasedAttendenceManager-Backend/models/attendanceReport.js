const mongoose = require("mongoose");

const attendanceReportSchema = new mongoose.Schema(
  {
    reportType: {
      type: String,
      required: true,
      enum: ["student_monthly", "course_wise", "semester", "student_course"],
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "course",
    },
    period: {
      month: {
        type: Number,
        min: 1,
        max: 12,
      },
      year: {
        type: Number,
        required: true,
        min: 2020,
        max: 2100,
      },
      semester: {
        type: String,
        enum: ["Spring",  "Autumn"],
      },
    },
    statistics: {
      totalSessions: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },
      attended: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },
      percentage: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
        max: 100,
      },
      lateCount: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    generatedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("attendanceReport", attendanceReportSchema);
