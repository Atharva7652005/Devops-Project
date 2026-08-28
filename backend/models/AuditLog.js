const mongoose = require('mongoose');

const auditLogSchema = mongoose.Schema(
  {
    action: {
      type: String,
      required: true, // e.g., 'USER_DELETED', 'TECHNICIAN_DELETED'
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    details: {
      type: Object, // Can store deleted user's info
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLog;
