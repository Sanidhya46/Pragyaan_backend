import { Skill, TraineeSkill } from '../models/Skill.model.js';
import { successResponse, errorResponse } from '../utils/response.util.js';

export const skillController = {
  async getTaxonomy(req, res) {
    try {
      const skills = await Skill.find().lean();
      return res.json(successResponse(skills));
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },

  async getTraineeSkills(req, res) {
    try {
      const traineeId = req.params.traineeId || req.user.userId;
      const skills = await TraineeSkill.find({ traineeId }).lean();
      return res.json(successResponse(skills));
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },
};
