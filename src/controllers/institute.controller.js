import { Institute } from '../models/Institute.model.js';
import { successResponse, errorResponse } from '../utils/response.util.js';

export const instituteController = {
  async getAll(req, res) {
    try {
      const institutes = await Institute.find().sort({ participantsTrained: -1 }).lean();
      return res.json(successResponse(institutes, 'Institutes retrieved successfully'));
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },

  async getById(req, res) {
    try {
      const { instituteId } = req.params;
      const institute = await Institute.findOne({ instituteId }).lean();
      if (!institute) {
        return res.status(404).json(errorResponse('Institute not found', 'NOT_FOUND'));
      }
      return res.json(successResponse(institute));
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },

  async updateInfrastructure(req, res) {
    try {
      const { instituteId } = req.params;
      const { classrooms, hostelBeds, smartEdgeNodes, computerLabs } = req.body;

      const institute = await Institute.findOneAndUpdate(
        { instituteId },
        {
          $set: {
            'infrastructure.classrooms': classrooms,
            'infrastructure.hostelBeds': hostelBeds,
            'infrastructure.smartEdgeNodes': smartEdgeNodes,
            'infrastructure.computerLabs': computerLabs,
          },
        },
        { new: true }
      );

      return res.json(successResponse(institute, 'Infrastructure updated'));
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },
};
