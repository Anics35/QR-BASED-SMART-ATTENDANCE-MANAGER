const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      required: true,
    },
    action: {
      type: String,
      required: true,
      // Ensure "course_created" is here from previous fixes
      enum: [
        "attendance_marked",
        "session_created",
        "qr_generated",
        "device_registered",
        "login",
        "logout",
        "unauthorized_attempt",
        "course_created", 
        "course_updated",
        "student_enrolled" ,
        "course_deleted"
      ],
    },
    entityType: {
      type: String,
      required: true,
      enum: ["attendance", "session", "user", "device", "course"],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    details: {
      deviceId: String,
      location: {
        latitude: Number,
        longitude: Number,
      },
      // --- UPDATE THIS SECTION ---
      outcome: {
        type: String,
        enum: ["success", "failure", "warning", "manual_override"], // <--- ADDED "manual_override"
        default: "success",
      },
      errorMessage: String,
      courseId: String,
      studentEmail: String 
    },
    ipAddress: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("auditLog", auditLogSchema);