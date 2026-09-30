import { Assessment, AssessmentAttempt } from '../models/Assessment.model.js';
import { TraineeSkill } from '../models/Skill.model.js';
import { successResponse, errorResponse } from '../utils/response.util.js';

export const assessmentController = {
  async getByProgramme(req, res) {
    try {
      const { programmeId } = req.params;
      const assessments = await Assessment.find({ programmeId, status: 'ACTIVE' }).lean();
      return res.json(successResponse(assessments));
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },

  async submitAttempt(req, res) {
    try {
      const { assessmentId, answers } = req.body;
      const traineeId = req.user.userId;

      const assessment = await Assessment.findOne({ assessmentId });
      if (!assessment) {
        return res.status(404).json(errorResponse('Assessment not found', 'NOT_FOUND'));
      }

      // Auto-grade objective questions
      let score = 0;
      const gradedAnswers = (answers || []).map((ans) => {
        const q = assessment.questions.find((question) => question.questionId === ans.questionId);
        const isCorrect = q && q.correctOptionIndex === ans.selectedOption;
        if (isCorrect) score += q.marks;
        return {
          questionId: ans.questionId,
          selectedOption: ans.selectedOption,
          isCorrect,
        };
      });

      const percentage = Math.round((score / assessment.totalMarks) * 100);
      const passed = percentage >= Math.round((assessment.passingMarks / assessment.totalMarks) * 100);

      const attemptId = `ATM-${Date.now().toString().slice(-6)}`;
      const attempt = new AssessmentAttempt({
        attemptId,
        assessmentId,
        traineeId,
        traineeName: req.user.name,
        score,
        percentage,
        passed,
        answers: gradedAnswers,
      });

      await attempt.save();

      // If passed, map learning evidence to skill
      if (passed && assessment.questions.length > 0) {
        const topSkill = assessment.questions[0].mappedSkill || 'Digital Literacy';
        await TraineeSkill.findOneAndUpdate(
          { traineeId, skillName: topSkill },
          {
            $set: { proficiencyScore: percentage, level: Math.min(5, Math.ceil(percentage / 20)) },
            $push: {
              evidence: {
                sourceType: 'ASSESSMENT',
                referenceId: attemptId,
                score: percentage,
              },
            },
          },
          { upsert: true, new: true }
        );
      }

      return res.status(201).json(
        successResponse(
          {
            attempt,
            summary: {
              score,
              totalMarks: assessment.totalMarks,
              percentage,
              passed,
            },
          },
          passed ? 'Assessment passed successfully!' : 'Assessment completed. Retake available.'
        )
      );
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },
};
