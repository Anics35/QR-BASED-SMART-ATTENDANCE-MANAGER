const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "course",
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sessionDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    sessionType: {
      type: String,
      required: true,
      enum: ["lecture", "lab", "tutorial"],
      default: "lecture",
    },
    qrCode: {
      sessionToken: {
        type: String,
        required: true,
        unique: true,
      },
      generatedAt: {
        type: Date,
        required: true,
        default: Date.now,
      },
      expiresAt: {
        type: Date,
        required: true,
        validate: {
          validator: function (value) {
            return value > this.qrCode.generatedAt;
          },
          message: "Expiry time must be after generation time",
        },
      },
      isValid: {
        type: Boolean,
        default: true,
      },
    },
    location: {
      latitude: {
        type: Number,
        required: true,
        min: -90,
        max: 90,
      },
      longitude: {
        type: Number,
        required: true,
        min: -180,
        max: 180,
      },
      radius: {
        type: Number,
        required: true,
        default: 50,
        min: 10,
        max: 500,
      },
    },
    status: {
      type: String,
      required: true,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
    duration: {
      type: Number,
      required: true,
      min: 30,
      max: 300,
      default: 60,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("session", sessionSchema);
