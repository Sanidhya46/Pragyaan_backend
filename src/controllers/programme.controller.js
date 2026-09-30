import { Programme } from '../models/Programme.model.js';
import { successResponse, errorResponse } from '../utils/response.util.js';

export const programmeController = {
  async getAll(req, res) {
    try {
      const { category, deliveryMode, instituteId, search } = req.query;
      const query = {};

      if (category) query.category = category;
      if (deliveryMode) query.deliveryMode = deliveryMode;
      if (instituteId) query.instituteId = instituteId;
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      const programmes = await Programme.find(query).sort({ createdAt: -1 }).lean();
      return res.json(successResponse(programmes, 'Programmes retrieved'));
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },

  async getById(req, res) {
    try {
      const { programmeId } = req.params;
      const programme = await Programme.findOne({ programmeId }).lean();
      if (!programme) {
        return res.status(404).json(errorResponse('Programme not found', 'NOT_FOUND'));
      }
      return res.json(successResponse(programme));
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },

  async create(req, res) {
    try {
      const programmeId = `PRG-${Date.now().toString().slice(-6)}`;
      const programme = new Programme({
        programmeId,
        ...req.body,
        instituteId: req.body.instituteId || req.user.instituteId,
      });
      await programme.save();
      return res.status(201).json(successResponse(programme, 'Programme created'));
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },

  async updateStatus(req, res) {
    try {
      const { programmeId } = req.params;
      const { status } = req.body;
      const programme = await Programme.findOneAndUpdate(
        { programmeId },
        { status },
        { new: true }
      );
      return res.json(successResponse(programme, `Programme status updated to ${status}`));
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },
};
