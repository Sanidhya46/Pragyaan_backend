import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    attendanceId: { type: String, unique: true, required: true },
    sessionId: { type: String, required: true },
    sessionTitle: { type: String, default: 'Class Session' },
    batchId: { type: String, required: true },
    programmeId: { type: String, required: true },
    instituteId: { type: String, required: true },
    traineeId: { type: String, required: true },
    traineeName: { type: String, default: '' },
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'], default: 'PRESENT' },
    verificationMethod: {
      type: String,
      enum: ['QR_DYNAMIC', 'QR_CARD', 'FACE_RECOGNITION', 'MANUAL_FALLBACK'],
      default: 'QR_DYNAMIC',
    },
    deviceId: { type: String, default: 'MOBILE_APP' },
    offlineSynced: { type: Boolean, default: false },
    operationId: { type: String },
  },
  { timestamps: true }
);

attendanceSchema.index({ sessionId: 1, traineeId: 1 }, { unique: true });

export const Attendance = mongoose.model('Attendance', attendanceSchema);

const sessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, unique: true, required: true },
    batchId: { type: String, required: true },
    title: { type: String, required: true },
    sessionDate: { type: Date, default: Date.now },
    startTime: { type: String, default: '10:00 AM' },
    endTime: { type: String, default: '11:30 AM' },
    trainerId: { type: String },
    classroom: { type: String, default: 'Room 101' },
    qrToken: { type: String },
    qrExpiry: { type: Date },
    status: { type: String, enum: ['SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED'], default: 'SCHEDULED' },
  },
  { timestamps: true }
);

export const AttendanceSession = mongoose.model('AttendanceSession', sessionSchema);
