const mongoose = require("mongoose");

const deviceBindingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    deviceId: {
      type: String,
      required: true,
      unique: true,
    },
    deviceInfo: {
      model: {
        type: String,
        maxlength: 100,
      },
      osVersion: {
        type: String,
        maxlength: 50,
      },
      appVersion: {
        type: String,
        default: "1.0.0",
      },
    },
    registeredAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    lastUsed: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    bindingToken: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("deviceBinding", deviceBindingSchema);
