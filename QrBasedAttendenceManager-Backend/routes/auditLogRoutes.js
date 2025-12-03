const express = require("express");
const router = express.Router();

const AuditLog = require("../models/auditLog");
const verifyJWT = require("../middleware/verifyJWT");

// Admin logs with filters
router.get("/", verifyJWT, async (req, res) => {
  try {
    const { userId, action, entityType, startDate, endDate } = req.query;

    const filter = {};

    if (userId) filter.userId = userId;
    if (action) filter.action = action;
    if (entityType) filter.entityType = entityType;

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(200);

    res.status(200).json(logs);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch logs", error: err.message });
  }
});

// Logs for one user
router.get("/user/:userId", verifyJWT, async (req, res) => {
  try {
    const logs = await AuditLog.find({ userId: req.params.userId }).sort({
      timestamp: -1,
    });

    res.status(200).json(logs);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user logs", error: err.message });
  }
});

module.exports = router;
