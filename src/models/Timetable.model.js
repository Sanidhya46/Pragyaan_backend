import mongoose from 'mongoose';

// Classroom Master
const classroomSchema = new mongoose.Schema(
  {
    classroomId: { type: String, unique: true, required: true },
    instituteId: { type: String, required: true, index: true },
    name: { type: String, required: true }, // e.g. 'Hall A - Digital Lab'
    capacity: { type: Number, required: true },
    hasProjector: { type: Boolean, default: true },
    hasComputerLab: { type: Boolean, default: false },
    hasSmartBoard: { type: Boolean, default: true },
    floor: { type: Number, default: 1 },
    status: { type: String, enum: ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE'], default: 'AVAILABLE' }
  },
  { timestamps: true }
);

// Scheduled Session Master with Conflict Tracking
const sessionScheduleSchema = new mongoose.Schema(
  {
    sessionId: { type: String, unique: true, required: true },
    instituteId: { type: String, required: true, index: true },
    programmeId: { type: String, required: true },
    batchId: { type: String, required: true, index: true },
    classroomId: { type: String, required: true, index: true },
    trainerId: { type: String, required: true, index: true },
    topic: { type: String, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    startTime: { type: String, required: true }, // HH:mm (e.g. '09:30')
    endTime: { type: String, required: true },   // HH:mm (e.g. '11:30')
    sessionType: { type: String, enum: ['LECTURE', 'PRACTICAL_LAB', 'WORKSHOP', 'ASSESSMENT'], default: 'LECTURE' },
    status: { type: String, enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], default: 'SCHEDULED' },
    conflictDetected: { type: Boolean, default: false },
    conflictDetails: { type: String, default: '' }
  },
  { timestamps: true }
);

export const Classroom = mongoose.model('Classroom', classroomSchema);
export const SessionSchedule = mongoose.model('SessionSchedule', sessionScheduleSchema);
