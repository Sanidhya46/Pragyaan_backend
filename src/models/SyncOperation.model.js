import mongoose from 'mongoose';

const syncOperationSchema = new mongoose.Schema(
  {
    operationId: { type: String, unique: true, required: true }, // Idempotency key
    deviceId: { type: String, required: true },
    entityType: { type: String, enum: ['ATTENDANCE', 'PROGRESS', 'ASSESSMENT_ATTEMPT'], required: true },
    entityId: { type: String, required: true },
    operationType: { type: String, enum: ['INSERT', 'UPDATE'], default: 'INSERT' },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    status: { type: String, enum: ['PROCESSED', 'FAILED', 'DUPLICATE_IGNORED'], default: 'PROCESSED' },
    processedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const SyncOperation = mongoose.model('SyncOperation', syncOperationSchema);

const auditLogSchema = new mongoose.Schema(
  {
    logId: { type: String, unique: true, required: true },
    userId: { type: String, required: true },
    userRole: { type: String, required: true },
    action: { type: String, required: true }, // e.g. "APPROVE_PROGRAMME", "ISSUE_CERTIFICATE", "MARK_ATTENDANCE"
    entity: { type: String, required: true },
    entityId: { type: String, required: true },
    instituteId: { type: String },
    details: { type: mongoose.Schema.Types.Mixed },
    ipAddress: { type: String },
  },
  { timestamps: true }
);

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
