import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema(
  {
    deviceId: { type: String, unique: true, required: true },
    instituteId: { type: String, required: true },
    deviceType: { type: String, enum: ['SMART_TRAINING_NODE', 'TABLET_KIOSK', 'MOBILE_SCANNER'], default: 'SMART_TRAINING_NODE' },
    roomLocation: { type: String, default: 'Classroom 101' },
    ipAddress: { type: String, default: '192.168.1.100' },
    softwareVersion: { type: String, default: '1.4.2' },
    storageFreeMb: { type: Number, default: 65536 },
    cameraStatus: { type: String, enum: ['OK', 'ERROR', 'NOT_CONNECTED'], default: 'OK' },
    qrScannerStatus: { type: String, enum: ['OK', 'ERROR', 'NOT_CONNECTED'], default: 'OK' },
    pendingSyncCount: { type: Number, default: 0 },
    status: { type: String, enum: ['ONLINE', 'OFFLINE'], default: 'ONLINE' },
    lastHeartbeat: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Device = mongoose.model('Device', deviceSchema);
