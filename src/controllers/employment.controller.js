import { Vacancy, JobApplication, EmploymentOutcome } from '../models/Employment.model.js';
import { matchingService } from '../services/matching.service.js';
import { successResponse, errorResponse } from '../utils/response.util.js';

export const employmentController = {
  async getVacancies(req, res) {
    try {
      const vacancies = await Vacancy.find({ status: 'OPEN' }).sort({ createdAt: -1 }).lean();
      return res.json(successResponse(vacancies));
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },

  async createVacancy(req, res) {
    try {
      const vacancyId = `VAC-${Date.now().toString().slice(-6)}`;
      const vacancy = new Vacancy({
        vacancyId,
        employerId: req.user.userId,
        companyName: req.body.companyName || 'Cooperative Enterprise',
        ...req.body,
      });
      await vacancy.save();
      return res.status(201).json(successResponse(vacancy, 'Vacancy published'));
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },

  async getMatchedVacancies(req, res) {
    try {
      const traineeId = req.user.userId;
      const matched = await matchingService.matchCandidateToVacancies(traineeId);
      return res.json(successResponse(matched, 'Ranked matching vacancies'));
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },

  async applyForJob(req, res) {
    try {
      const { vacancyId } = req.body;
      const traineeId = req.user.userId;

      const existing = await JobApplication.findOne({ vacancyId, traineeId });
      if (existing) {
        return res.status(400).json(errorResponse('Already applied to this opening', 'ALREADY_APPLIED'));
      }

      const applicationId = `APP-${Date.now().toString().slice(-6)}`;
      const application = new JobApplication({
        applicationId,
        vacancyId,
        traineeId,
        traineeName: req.user.name,
        traineeEmail: req.user.email,
        status: 'APPLIED',
      });

      await application.save();
      return res.status(201).json(successResponse(application, 'Application submitted successfully'));
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },

  async getMyApplications(req, res) {
    try {
      const applications = await JobApplication.find({ traineeId: req.user.userId }).lean();
      return res.json(successResponse(applications));
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },

  async getOutcomes(req, res) {
    try {
      const outcomes = await EmploymentOutcome.find().sort({ joinedDate: -1 }).lean();
      return res.json(successResponse(outcomes));
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },

  async recordOutcome(req, res) {
    try {
      const outcomeId = `OUT-${Date.now().toString().slice(-6)}`;
      const outcome = new EmploymentOutcome({
        outcomeId,
        ...req.body,
      });
      await outcome.save();
      return res.status(201).json(successResponse(outcome, 'Employment outcome verified and recorded'));
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },
};
