import mongoose from 'mongoose';

// Audit Trail Record
const auditLogSchema = new mongoose.Schema(
  {
    logId: { type: String, unique: true, required: true },
    actorId: { type: String, required: true },
    actorName: { type: String, default: 'System' },
    actorRole: { type: String, required: true },
    instituteId: { type: String, default: 'INST-NCCT-HQ' },
    action: { type: String, required: true }, // e.g. 'PROGRAMME_APPROVED', 'CERTIFICATE_REVOKED', 'ATTENDANCE_CORRECTED'
    entityType: { type: String, required: true }, // e.g. 'Programme', 'Certificate', 'Attendance'
    entityId: { type: String, required: true },
    previousState: { type: mongoose.Schema.Types.Mixed },
    newState: { type: mongoose.Schema.Types.Mixed },
    reason: { type: String, default: '' },
    ipAddress: { type: String, default: '127.0.0.1' },
    userAgent: { type: String, default: 'PRAGYAAN_CLIENT' }
  },
  { timestamps: true }
);

// Notifications Engine
const notificationSchema = new mongoose.Schema(
  {
    notificationId: { type: String, unique: true, required: true },
    recipientId: { type: String, required: true, index: true }, // Trainee, Trainer, Admin
    recipientRole: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    channel: { type: String, enum: ['IN_APP', 'SMS', 'EMAIL', 'PUSH'], default: 'IN_APP' },
    category: {
      type: String,
      enum: ['SESSION_REMINDER', 'ATTENDANCE_ALERT', 'ASSESSMENT_READY', 'CERTIFICATE_ISSUED', 'JOB_MATCH', 'APPROVAL_REQUIRED'],
      default: 'SESSION_REMINDER'
    },
    isRead: { type: Boolean, default: false },
    actionUrl: { type: String, default: '' }
  },
  { timestamps: true }
);

// Feedback & Surveys
const feedbackSchema = new mongoose.Schema(
  {
    feedbackId: { type: String, unique: true, required: true },
    programmeId: { type: String, required: true, index: true },
    batchId: { type: String, required: true },
    traineeId: { type: String, required: true },
    trainerRating: { type: Number, min: 1, max: 5, default: 5 },
    contentRating: { type: Number, min: 1, max: 5, default: 5 },
    facilityRating: { type: Number, min: 1, max: 5, default: 5 },
    overallExperience: { type: Number, min: 1, max: 5, default: 5 },
    comments: { type: String, default: '' },
    suggestedImprovements: { type: String, default: '' }
  },
  { timestamps: true }
);

export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
export const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
export const Feedback = mongoose.models.Feedback || mongoose.model('Feedback', feedbackSchema);
