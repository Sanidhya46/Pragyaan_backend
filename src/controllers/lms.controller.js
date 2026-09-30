import { Course, UserProgress } from '../models/Lms.model.js';
import { successResponse, errorResponse } from '../utils/response.util.js';

export const lmsController = {
  async getCourses(req, res) {
    try {
      const { programmeId } = req.query;
      const query = { status: 'PUBLISHED' };
      if (programmeId) query.programmeId = programmeId;

      const courses = await Course.find(query).lean();
      return res.json(successResponse(courses));
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },

  async getCourseById(req, res) {
    try {
      const { courseId } = req.params;
      const course = await Course.findOne({ courseId }).lean();
      if (!course) {
        return res.status(404).json(errorResponse('Course not found', 'NOT_FOUND'));
      }
      return res.json(successResponse(course));
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },

  async updateProgress(req, res) {
    try {
      const { courseId, lessonId, progressPercentage } = req.body;
      const traineeId = req.user.userId;

      let record = await UserProgress.findOne({ traineeId, courseId });
      if (!record) {
        record = new UserProgress({
          traineeId,
          courseId,
          completedLessons: [lessonId],
          progressPercentage: progressPercentage || 10,
          lastAccessedLessonId: lessonId,
        });
      } else {
        if (!record.completedLessons.includes(lessonId)) {
          record.completedLessons.push(lessonId);
        }
        // Monotonic progression
        record.progressPercentage = Math.max(record.progressPercentage, progressPercentage || 0);
        record.lastAccessedLessonId = lessonId;
        record.lastActiveDate = new Date();
      }

      await record.save();
      return res.json(successResponse(record, 'Progress updated'));
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },

  async getMyProgress(req, res) {
    try {
      const progress = await UserProgress.find({ traineeId: req.user.userId }).lean();
      return res.json(successResponse(progress));
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },

  /**
   * Generates offline package manifest for mobile & edge downloads
   */
  async getCourseOfflinePackage(req, res) {
    try {
      const { courseId } = req.params;
      const course = await Course.findOne({ courseId }).lean();
      if (!course) {
        return res.status(404).json(errorResponse('Course not found', 'NOT_FOUND'));
      }

      const packageManifest = {
        packageId: `PKG-${course.courseId}-v1`,
        courseId: course.courseId,
        title: course.title,
        version: 1,
        totalLessons: course.modules.reduce((acc, m) => acc + m.lessons.length, 0),
        modules: course.modules,
        assets: [
          { type: 'PDF', title: 'Course Guide & Workbook', sizeMb: 4.2, url: '/offline/guides/guide.pdf' },
          { type: 'VIDEO', title: 'Module 1 Video Lecture (Hindi & English)', sizeMb: 45.0, url: '/offline/videos/m1.mp4' },
        ],
        generatedAt: new Date().toISOString(),
      };

      return res.json(successResponse(packageManifest, 'Offline course package manifest generated'));
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },
};
