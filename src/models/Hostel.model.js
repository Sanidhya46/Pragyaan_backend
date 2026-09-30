import mongoose from 'mongoose';

// Hostel Block & Room Schema
const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  roomNumber: { type: String, required: true },
  floor: { type: Number, default: 1 },
  capacity: { type: Number, default: 2 },
  occupiedBeds: { type: Number, default: 0 },
  type: { type: String, enum: ['AC', 'NON_AC', 'SUITE'], default: 'NON_AC' },
  status: { type: String, enum: ['AVAILABLE', 'FULL', 'MAINTENANCE'], default: 'AVAILABLE' }
});

const hostelBlockSchema = new mongoose.Schema(
  {
    blockId: { type: String, unique: true, required: true },
    instituteId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    gender: { type: String, enum: ['MALE', 'FEMALE', 'COED'], default: 'COED' },
    totalCapacity: { type: Number, required: true },
    totalOccupancy: { type: Number, default: 0 },
    rooms: [roomSchema],
  },
  { timestamps: true }
);

// Hostel Allocation Schema (Linking Trainee to Hostel/Bed)
const hostelAllocationSchema = new mongoose.Schema(
  {
    allocationId: { type: String, unique: true, required: true },
    instituteId: { type: String, required: true, index: true },
    traineeId: { type: String, required: true, index: true },
    traineeName: { type: String, required: true },
    programmeId: { type: String, required: true },
    batchId: { type: String, required: true },
    blockId: { type: String, required: true },
    roomId: { type: String, required: true },
    bedNumber: { type: String, required: true },
    checkInDate: { type: Date, required: true },
    checkOutDate: { type: Date },
    status: {
      type: String,
      enum: ['ALLOCATED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'],
      default: 'ALLOCATED'
    },
    specialRequests: { type: String, default: '' },
    remarks: { type: String, default: '' }
  },
  { timestamps: true }
);

export const HostelBlock = mongoose.model('HostelBlock', hostelBlockSchema);
export const HostelAllocation = mongoose.model('HostelAllocation', hostelAllocationSchema);
