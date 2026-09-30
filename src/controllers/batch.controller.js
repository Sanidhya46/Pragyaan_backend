import { Batch } from '../models/Batch.model.js';
import { successResponse, errorResponse } from '../utils/response.util.js';

export const batchController = {
  async getAll(req, res) {
    try {
      const { programmeId, instituteId } = req.query;
      const query = {};
      if (programmeId) query.programmeId = programmeId;
      if (instituteId) query.instituteId = instituteId;

      const batches = await Batch.find(query).sort({ startDate: -1 }).lean();
      return res.json(successResponse(batches));
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },

  async create(req, res) {
    try {
      const batchId = `BATCH-${Date.now().toString().slice(-6)}`;
      const batch = new Batch({
        batchId,
        ...req.body,
        instituteId: req.body.instituteId || req.user.instituteId,
      });
      await batch.save();
      return res.status(201).json(successResponse(batch, 'Batch created'));
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },
};
