import mongoose from 'mongoose';

const instituteSchema = new mongoose.Schema(
  {
    instituteId: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    type: { type: String, enum: ['NATIONAL_APEX', 'RICM', 'ICM', 'AFFILIATED'], default: 'ICM' },
    state: { type: String, required: true },
    district: { type: String, required: true },
    address: { type: String, default: '' },
    directorName: { type: String, default: '' },
    contactEmail: { type: String, default: '' },
    contactPhone: { type: String, default: '' },
    capacity: { type: Number, default: 500 },
    participantsTrained: { type: Number, default: 0 },
    completionRate: { type: Number, default: 90 },
    establishedYear: { type: Number, default: 1980 },
    infrastructure: {
      classrooms: { type: Number, default: 10 },
      hostelBeds: { type: Number, default: 120 },
      smartEdgeNodes: { type: Number, default: 2 },
      computerLabs: { type: Number, default: 3 },
    },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'PENDING_APPROVAL'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

export const Institute = mongoose.model('Institute', instituteSchema);
