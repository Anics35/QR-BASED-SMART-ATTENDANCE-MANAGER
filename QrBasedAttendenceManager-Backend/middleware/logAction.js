const AuditLog = require("../models/auditLog");

/**
 * Log any important action
 * @param {Object} options
 */
async function logAction({
  userId,
  action,
  entityType,
  entityId,
  details = {},
  ip = "0.0.0.0",
}) {
  try {
    await AuditLog.create({
      userId,
      action,
      entityType,
      entityId,
      details,
      ipAddress: ip,
    });
  } catch (err) {
    console.error("Audit log failed:", err.message);
  }
}

module.exports = logAction;
