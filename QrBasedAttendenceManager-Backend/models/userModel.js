// models/userModel.js
const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 100,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate(value) {
        if (!validator.isEmail(value) || !value.toLowerCase().endsWith("@tezu.ac.in")) {
          throw new Error("Only tezu.ac.in addresses are allowed");
        }
      },
    },
    googleId: {
      type: String,
      unique: true,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["student", "teacher", "admin"],
    },

    rollNumber: {
      type: String,
      required: function () {
        return this.role === "student";
      },
      trim: true,
      uppercase: true,
      minlength: 3,
      maxlength: 30,
      validate(value) {
        if (!/^[A-Z0-9][A-Z0-9\-\/]*$/.test(value)) {
          throw new Error("Invalid roll number format");
        }
      },
    },

   deviceId: {
      type: String,
      default: "" // Allow empty string
    },
    
    department: {
      type: String,
      maxlength: 50,
    },
    semester: {
      type: String,
    },
    photoUrl: {
      type: String,
      default: "https://geographyandyou.com/images/user-profile.png",
      validate(value) {
        if (!validator.isURL(value)) {
          throw new Error("Invalid photo URL");
        }
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Unique among students only
//userSchema.index({ role: 1, rollNumber: 1 }, { unique: true, sparse: true });
userSchema.index(
  { rollNumber: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { role: "student" } 
  }
);

module.exports = mongoose.model("User", userSchema);
