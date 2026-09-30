import { aiService } from '../services/ai.service.js';
import { successResponse, errorResponse } from '../utils/response.util.js';

export const aiController = {
  async getCareerGuidance(req, res) {
    try {
      const { query, role, language } = req.body;
      const traineeId = req.user?.userId || req.body.userId || 'USR-10001';
      const userRole = role || req.user?.role || 'TRAINEE';
      const userLanguage = language || 'English';
      const result = await aiService.getCareerGuidance(traineeId, query, userRole, userLanguage);
      return res.json(successResponse(result, 'AI guidance generated'));
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },

  async getSkillGapAnalysis(req, res) {
    try {
      const { targetJobTitle } = req.body;
      const traineeId = req.user?.userId || 'USR-10001';
      const result = await aiService.calculateSkillGap(traineeId, targetJobTitle);
      return res.json(successResponse(result, 'Skill-gap analysis calculated'));
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },
};
