import { Enrollment } from '../models/Enrollment.model.js';
import { Programme } from '../models/Programme.model.js';
import { successResponse, errorResponse } from '../utils/response.util.js';

export const enrollmentController = {
  async register(req, res) {
    try {
      const { programmeId, batchId, enrollmentType = 'SELF_REGISTRATION', nominationDetails } = req.body;
      const traineeId = req.user.userId;

      const programme = await Programme.findOne({ programmeId });
      if (!programme) {
        return res.status(404).json(errorResponse('Programme not found', 'NOT_FOUND'));
      }

      const existing = await Enrollment.findOne({ traineeId, programmeId });
      if (existing) {
        return res.status(400).json(errorResponse('Already registered for this programme', 'ALREADY_REGISTERED'));
      }

      const enrollmentId = `ENR-${Date.now().toString().slice(-6)}`;
      const enrollment = new Enrollment({
        enrollmentId,
        traineeId,
        traineeName: req.user.name,
        traineeEmail: req.user.email,
        programmeId: programme.programmeId,
        programmeTitle: programme.title,
        batchId: batchId || '',
        instituteId: programme.instituteId,
        enrollmentType,
        nominationDetails: nominationDetails || {},
        status: 'ENROLLED',
        faceEnrolled: Boolean(req.body.faceImage || req.body.faceImageUrl),
        faceImageUrl: req.body.faceImage || req.body.faceImageUrl || '',
      });

      await enrollment.save();

      if (req.body.faceImage || req.body.faceImageUrl) {
        await User.updateOne(
          { userId: traineeId },
          {
            $set: {
              'traineeDetails.faceEnrolled': true,
              'traineeDetails.faceImageUrl': req.body.faceImage || req.body.faceImageUrl,
              avatarUrl: req.body.faceImage || req.body.faceImageUrl,
            },
          }
        );
      }

      // Increment programme enrolledCount
      await Programme.updateOne({ programmeId }, { $inc: { enrolledCount: 1 } });

      return res.status(201).json(successResponse(enrollment, 'Successfully enrolled in programme with biometric face capture'));
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },

  async getMyEnrollments(req, res) {
    try {
      const enrollments = await Enrollment.find({ traineeId: req.user.userId }).lean();
      return res.json(successResponse(enrollments));
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },

  async getAll(req, res) {
    try {
      const { programmeId, instituteId, status } = req.query;
      const query = {};
      if (programmeId) query.programmeId = programmeId;
      if (instituteId) query.instituteId = instituteId;
      if (status) query.status = status;

      const enrollments = await Enrollment.find(query).sort({ createdAt: -1 }).lean();
      return res.json(successResponse(enrollments));
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },

  async updateStatus(req, res) {
    try {
      const { enrollmentId } = req.params;
      const { status } = req.body;
      const enrollment = await Enrollment.findOneAndUpdate(
        { enrollmentId },
        { status },
        { new: true }
      );
      return res.json(successResponse(enrollment, `Status updated to ${status}`));
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },
};
