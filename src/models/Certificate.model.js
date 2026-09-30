import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema(
  {
    certificateId: { type: String, unique: true, required: true },
    credentialId: { type: String, unique: true, required: true },
    traineeId: { type: String, required: true },
    traineeName: { type: String, required: true },
    programmeId: { type: String, required: true },
    programmeTitle: { type: String, required: true },
    instituteId: { type: String, required: true },
    instituteName: { type: String, required: true },
    issueDate: { type: Date, default: Date.now },
    completionScore: { type: Number, default: 85 },
    skillsCertified: [{ type: String }],
    digitalSignature: { type: String, required: true },
    qrVerificationUrl: { type: String, required: true },
    status: { type: String, enum: ['VALID', 'REVOKED', 'SUPERSEDED'], default: 'VALID' },
  },
  { timestamps: true }
);

export const Certificate = mongoose.model('Certificate', certificateSchema);
