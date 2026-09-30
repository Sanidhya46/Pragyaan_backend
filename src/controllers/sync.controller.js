import { SyncOperation } from '../models/SyncOperation.model.js';
import { Attendance } from '../models/Attendance.model.js';
import { UserProgress } from '../models/Lms.model.js';
import { AssessmentAttempt } from '../models/Assessment.model.js';
import { successResponse, errorResponse } from '../utils/response.util.js';

export const syncController = {
  /**
   * Idempotent Batch Sync Endpoint
   * Accepts an array of outbox operations from offline Edge nodes or Mobile clients
   */
  async processBatch(req, res) {
    try {
      const { deviceId, operations = [] } = req.body;

      if (!operations || !Array.isArray(operations)) {
        return res.status(400).json(errorResponse('operations array is required', 'VALIDATION_ERROR'));
      }

      const results = [];

      for (const op of operations) {
        const { operationId, entityType, entityId, operationType = 'INSERT', payload } = op;

        if (!operationId) continue;

        // Idempotency check: Has this operation already been processed?
        const existingOp = await SyncOperation.findOne({ operationId });
        if (existingOp) {
          results.push({
            operationId,
            status: 'DUPLICATE_IGNORED',
            message: 'Operation already processed previously',
          });
          continue;
        }

        try {
          // Entity-specific conflict resolution and insertion
          if (entityType === 'ATTENDANCE') {
            const { sessionId, traineeId, batchId, programmeId, instituteId, verificationMethod } = payload;
            const existingAttendance = await Attendance.findOne({ sessionId, traineeId });

            if (!existingAttendance) {
              const attendance = new Attendance({
                attendanceId: entityId || `ATT-${Date.now()}`,
                sessionId,
                batchId,
                programmeId,
                instituteId,
                traineeId,
                traineeName: payload.traineeName || 'Learner',
                verificationMethod: verificationMethod || 'QR_CARD',
                deviceId: deviceId || 'OFFLINE_NODE',
                offlineSynced: true,
                operationId,
              });
              await attendance.save();
            }
          } else if (entityType === 'PROGRESS') {
            const { traineeId, courseId, lessonId, progressPercentage } = payload;
            let record = await UserProgress.findOne({ traineeId, courseId });
            if (!record) {
              record = new UserProgress({
                traineeId,
                courseId,
                completedLessons: [lessonId],
                progressPercentage: progressPercentage || 10,
              });
            } else {
              record.progressPercentage = Math.max(record.progressPercentage, progressPercentage || 0);
              if (lessonId && !record.completedLessons.includes(lessonId)) {
                record.completedLessons.push(lessonId);
              }
            }
            await record.save();
          } else if (entityType === 'ASSESSMENT_ATTEMPT') {
            const { attemptId, assessmentId, traineeId, score, percentage, passed, answers } = payload;
            const existingAttempt = await AssessmentAttempt.findOne({ attemptId });
            if (!existingAttempt) {
              const attempt = new AssessmentAttempt({
                attemptId,
                assessmentId,
                traineeId,
                score,
                percentage,
                passed,
                answers: answers || [],
              });
              await attempt.save();
            }
          }

          // Record sync operation execution
          const syncRecord = new SyncOperation({
            operationId,
            deviceId: deviceId || 'UNKNOWN_DEVICE',
            entityType,
            entityId,
            operationType,
            payload,
            status: 'PROCESSED',
          });
          await syncRecord.save();

          results.push({ operationId, status: 'PROCESSED' });
        } catch (innerErr) {
          results.push({ operationId, status: 'FAILED', error: innerErr.message });
        }
      }

      return res.json(
        successResponse(
          {
            totalReceived: operations.length,
            processedCount: results.filter((r) => r.status === 'PROCESSED').length,
            duplicatesCount: results.filter((r) => r.status === 'DUPLICATE_IGNORED').length,
            results,
          },
          'Batch sync completed'
        )
      );
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },
};
