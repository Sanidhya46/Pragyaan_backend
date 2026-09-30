import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema(
  {
    enrollmentId: { type: String, unique: true, required: true },
    traineeId: { type: String, required: true },
    traineeName: { type: String, required: true },
    traineeEmail: { type: String, required: true },
    programmeId: { type: String, required: true },
    programmeTitle: { type: String, required: true },
    batchId: { type: String, default: '' },
    instituteId: { type: String, required: true },
    enrollmentType: { type: String, enum: ['SELF_REGISTRATION', 'INSTITUTIONAL_NOMINATION'], default: 'SELF_REGISTRATION' },
    nominationDetails: {
      nominatingOrgName: { type: String, default: '' },
      contactPerson: { type: String, default: '' },
      designation: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['APPLIED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'ENROLLED', 'COMPLETED', 'DROPPED'],
      default: 'ENROLLED',
    },
    learningProgress: { type: Number, default: 0 },
    attendancePercentage: { type: Number, default: 0 },
    assessmentAverage: { type: Number, default: 0 },
    certificateIssued: { type: Boolean, default: false },
    certificateId: { type: String, default: '' },
    faceEnrolled: { type: Boolean, default: false },
    faceImageUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
