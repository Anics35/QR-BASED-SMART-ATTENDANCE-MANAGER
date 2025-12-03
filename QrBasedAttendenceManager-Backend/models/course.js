const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    courseCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 15,
    },
    courseName: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 150,
      trim: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // <--- Capitalized "User" matches userModel.js
      required: true,
    },
    semester: {
      type: String,
      required: true,
      enum: ["Spring", "Fall", "Autumn"],
    },
    year: {
      type: Number,
      required: true,
      min: 2020,
      max: 2100,
    },
    department: {
      type: String,
      required: true,
      maxlength: 100,
    },
    // --- NEW: Required for "Join Class" Feature ---
    enrolledStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // <--- Capitalized "User"
      },
    ],
    // --- Location for Geo-fencing ---
    location: {
      room: {
        type: String,
        default: "TBD"
      },
      building: {
        type: String,
        default: "Main"
      },
      coordinates: {
        latitude: {
          type: Number,
          min: -90,
          max: 90,
          default: 0
        },
        longitude: {
          type: Number,
          min: -180,
          max: 180,
          default: 0
        },
        radius: {
          type: Number,
          default: 50, // Default 50 meters
          min: 10,
          max: 500,
        },
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Keep model name "course" (lowercase) to match refs in Session/Attendance models
module.exports = mongoose.model("course", courseSchema);