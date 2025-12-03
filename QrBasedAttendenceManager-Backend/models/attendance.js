const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "session",
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "course",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    deviceValidation: {
      deviceId: {
        type: String,
        required: true,
      },
      isValidDevice: {
        type: Boolean,
        required: true,
        default: false,
      },
    },
    locationValidation: {
      studentLatitude: {
        type: Number,
        required: true,
        min: -90,
        max: 90,
      },
      studentLongitude: {
        type: Number,
        required: true,
        min: -180,
        max: 180,
      },
      distance: {
        type: Number,
        required: true,
        min: 0,
      },
      isWithinRadius: {
        type: Boolean,
        required: true,
        default: false,
      },
    },
    qrValidation: {
      sessionToken: {
        type: String,
        required: true,
      },
      isValid: {
        type: Boolean,
        required: true,
        default: false,
      },
      scannedAt: {
        type: Date,
        required: true,
        default: Date.now,
      },
    },
    status: {
      type: String,
      required: true,
      enum: ["present", "absent", "late"],
      default: "absent",
    },
    validationErrors: [
      {
        type: String,
      },
    ],
    metadata: {
      appVersion: {
        type: String,
        default: "1.0.0",
      },
      platform: {
        type: String,
        enum: ["android", "ios", "web"],
      },
    },
  },
  {
    timestamps: true,
  }
);


attendanceSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model("attendance", attendanceSchema);
