import mongoose from 'mongoose';

// Training Logistics Task / Requirement Schema
const logisticsTaskSchema = new mongoose.Schema(
  {
    taskId: { type: String, unique: true, required: true },
    instituteId: { type: String, required: true, index: true },
    programmeId: { type: String, required: true, index: true },
    batchId: { type: String, required: true },
    category: {
      type: String,
      enum: ['CLASSROOM_EQUIPMENT', 'TRAINING_KITS', 'PRINTED_MATERIAL', 'FOOD_CATERING', 'TRANSPORT', 'ACCOMMODATION'],
      required: true
    },
    description: { type: String, required: true },
    quantityRequired: { type: Number, default: 1 },
    assignedTo: { type: String, default: 'Institute Operations Desk' },
    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'READY', 'COMPLETED'],
      default: 'PENDING'
    },
    dueDate: { type: Date },
    costEstimate: { type: Number, default: 0 },
    remarks: { type: String, default: '' }
  },
  { timestamps: true }
);

// Asset Management Schema
const assetSchema = new mongoose.Schema(
  {
    assetId: { type: String, unique: true, required: true },
    instituteId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    category: {
      type: String,
      enum: ['SMART_EDGE_NODE', 'QR_SCANNER', 'BIOMETRIC_CAMERA', 'PROJECTOR', 'DESKTOP_PC', 'NETWORKING_ROUTER'],
      required: true
    },
    serialNumber: { type: String, required: true },
    location: { type: String, required: true }, // e.g., 'Lab 102', 'Auditorium'
    status: {
      type: String,
      enum: ['OPERATIONAL', 'UNDER_MAINTENANCE', 'DECOMMISSIONED'],
      default: 'OPERATIONAL'
    },
    lastMaintenanceDate: { type: Date },
    softwareVersion: { type: String, default: 'v1.0.0' }
  },
  { timestamps: true }
);

export const LogisticsTask = mongoose.model('LogisticsTask', logisticsTaskSchema);
export const Asset = mongoose.model('Asset', assetSchema);
