import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema(
  {
    batchId: { type: String, unique: true, required: true },
    batchName: { type: String, required: true },
    programmeId: { type: String, required: true },
    instituteId: { type: String, required: true },
    trainerId: { type: String, default: '' },
    trainerName: { type: String, default: '' },
    capacity: { type: Number, default: 40 },
    currentEnrollment: { type: Number, default: 0 },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    classroom: {
      roomNumber: { type: String, default: 'Room 101' },
      building: { type: String, default: 'Academic Block A' },
      hasSmartNode: { type: Boolean, default: true },
      nodeDeviceId: { type: String, default: 'EDGE-VAM-01' },
    },
    status: { type: String, enum: ['UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

export const Batch = mongoose.model('Batch', batchSchema);
