import { Device } from '../models/Device.model.js';
import { successResponse, errorResponse } from '../utils/response.util.js';

export const deviceController = {
  async registerOrHeartbeat(req, res) {
    try {
      const {
        deviceId,
        instituteId = 'INST-VAMNICOM',
        deviceType = 'SMART_TRAINING_NODE',
        softwareVersion = '1.4.2',
        storageFreeMb = 65536,
        cameraStatus = 'OK',
        qrScannerStatus = 'OK',
        pendingSyncCount = 0,
      } = req.body;

      if (!deviceId) {
        return res.status(400).json(errorResponse('deviceId is required'));
      }

      const device = await Device.findOneAndUpdate(
        { deviceId },
        {
          $set: {
            instituteId,
            deviceType,
            softwareVersion,
            storageFreeMb,
            cameraStatus,
            qrScannerStatus,
            pendingSyncCount,
            status: 'ONLINE',
            lastHeartbeat: new Date(),
          },
        },
        { upsert: true, new: true }
      );

      return res.json(successResponse(device, 'Heartbeat acknowledged'));
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },

  async getAllDevices(req, res) {
    try {
      const devices = await Device.find().lean();
      return res.json(successResponse(devices));
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },
};
