import express from 'express';
import { learnerController } from '../controllers/learner.controller.js';
import { attendanceController } from '../controllers/attendance.controller.js';

const router = express.Router();

// Learner Identity Middleware (Extracts trainee context from JWT or headers)
const learnerContext = (req, res, next) => {
  req.learnerContext = {
    traineeId: req.headers['x-pragyaan-trainee-id'] || 'TR-DEMO-001',
    instituteId: req.headers['x-pragyaan-institute'] || 'INST-VAMNICOM-01',
    role: 'TRAINEE',
  };
  next();
};

router.use(learnerContext);

// ══════════════════════════════════════════════════════════════════════════
// DOMAIN 01 — AUTHENTICATION (9 APIs)
// ══════════════════════════════════════════════════════════════════════════
router.post('/auth/register', learnerController.register);
router.post('/auth/login', learnerController.login);
router.post('/auth/verify-otp', learnerController.verifyOtp);
router.post('/auth/resend-otp', learnerController.resendOtp);
router.post('/auth/refresh', learnerController.refreshToken);
router.post('/auth/logout', learnerController.logout);
router.post('/auth/forgot-password', learnerController.forgotPassword);
router.post('/auth/reset-password', learnerController.resetPassword);
router.get('/auth/session', learnerController.getSession);

// ══════════════════════════════════════════════════════════════════════════
// DOMAIN 02 — LEARNER PROFILE (7 APIs)
// ══════════════════════════════════════════════════════════════════════════
router.get('/profile', learnerController.getProfile);
router.patch('/profile', learnerController.updateProfile);
router.get('/profile/education', learnerController.getEducation);
router.post('/profile/education', learnerController.addEducation);
router.patch('/profile/education/:id', learnerController.updateEducation);
router.delete('/profile/education/:id', learnerController.deleteEducation);
router.get('/profile/completion', learnerController.getProfileCompletion);

// ══════════════════════════════════════════════════════════════════════════
// DOMAIN 03 — DASHBOARD & HOME SNAPSHOT (5 APIs)
// ══════════════════════════════════════════════════════════════════════════
router.get('/dashboard', learnerController.getDashboard);
router.get('/dashboard/today-learning', learnerController.getTodayLearning);
router.get('/dashboard/today-training', learnerController.getTodayTraining);
router.get('/dashboard/skills-summary', learnerController.getSkillsSummary);
router.get('/dashboard/offline-summary', learnerController.getOfflineSummary);

// ══════════════════════════════════════════════════════════════════════════
// DOMAIN 04 — PROGRAMME DISCOVERY (8 APIs)
// ══════════════════════════════════════════════════════════════════════════
router.get('/programmes', learnerController.getProgrammes);
router.get('/programmes/recommended', learnerController.getRecommendedProgrammes);
router.get('/programmes/categories', learnerController.getProgrammeCategories);
router.get('/programmes/:id', learnerController.getProgrammeById);
router.get('/programmes/:id/courses', learnerController.getProgrammeCourses);
router.get('/programmes/:id/eligibility', learnerController.getProgrammeEligibility);
router.get('/programmes/:id/schedule', learnerController.getProgrammeSchedule);
router.get('/programmes/:id/skills', learnerController.getProgrammeSkills);

// ══════════════════════════════════════════════════════════════════════════
// DOMAIN 05 — APPLICATIONS & ENROLLMENTS (9 APIs)
// ══════════════════════════════════════════════════════════════════════════
router.post('/applications', learnerController.createApplication);
router.get('/applications', learnerController.getApplications);
router.get('/applications/:id', learnerController.getApplicationById);
router.delete('/applications/:id', learnerController.withdrawApplication);
router.get('/applications/:id/status', learnerController.getApplicationStatus);
router.get('/enrollments', learnerController.getEnrollments);
router.get('/enrollments/:id', learnerController.getEnrollmentById);
router.get('/enrollments/:id/status', learnerController.getEnrollmentStatus);
router.get('/enrollments/:id/batch', learnerController.getEnrollmentBatch);

// ══════════════════════════════════════════════════════════════════════════
// DOMAIN 06 — MY LEARNING / LMS (15 APIs)
// ══════════════════════════════════════════════════════════════════════════
router.get('/learning/programmes', learnerController.getMyProgrammes);
router.get('/learning/programmes/:id', learnerController.getMyProgrammeById);
router.get('/learning/courses', learnerController.getMyCourses);
router.get('/learning/courses/:id', learnerController.getMyCourseById);
router.get('/learning/courses/:id/modules', learnerController.getCourseModules);
router.get('/learning/modules/:id', learnerController.getModuleById);
router.get('/learning/lessons/:id', learnerController.getLessonById);
router.get('/learning/lessons/:id/content', learnerController.getLessonContent);
router.post('/learning/lessons/:id/start', learnerController.startLesson);
router.post('/learning/lessons/:id/progress', learnerController.updateLessonProgress);
router.post('/learning/lessons/:id/complete', learnerController.completeLesson);
router.get('/learning/continue', learnerController.continueLearning);
router.get('/learning/completed', learnerController.getCompletedCourses);
router.get('/learning/resources', learnerController.getLearningResources);
router.post('/learning/notes', learnerController.saveNote);

// ══════════════════════════════════════════════════════════════════════════
// DOMAIN 07 — PROGRESS & EVENTS (6 APIs)
// ══════════════════════════════════════════════════════════════════════════
router.get('/progress', learnerController.getProgress);
router.get('/progress/programmes/:id', learnerController.getProgrammeProgress);
router.get('/progress/courses/:id', learnerController.getCourseProgress);
router.get('/progress/modules/:id', learnerController.getModuleProgress);
router.get('/progress/lessons/:id', learnerController.getLessonProgress);
router.post('/progress/events', learnerController.postProgressEvent);

// ══════════════════════════════════════════════════════════════════════════
// DOMAIN 08 — OFFLINE LEARNING & SYNC (11 APIs)
// ══════════════════════════════════════════════════════════════════════════
router.get('/offline/packages', learnerController.getOfflinePackages);
router.get('/offline/packages/:id', learnerController.getOfflinePackageById);
router.post('/offline/packages/:id/download', learnerController.downloadOfflinePackage);
router.delete('/offline/packages/:id', learnerController.deleteOfflinePackage);
router.get('/offline/storage', learnerController.getOfflineStorage);
router.get('/offline/status', learnerController.getOfflineStatus);
router.post('/offline/manifest', learnerController.compareManifest);
router.post('/sync/push', learnerController.pushSync);
router.post('/sync/pull', learnerController.pullSync);
router.get('/sync/status', learnerController.getSyncStatus);
router.post('/sync/retry', learnerController.retrySync);

// ══════════════════════════════════════════════════════════════════════════
// DOMAIN 09 — ATTENDANCE & QR ROLL CALL (7 APIs)
// ══════════════════════════════════════════════════════════════════════════
router.get('/attendance', learnerController.getAttendance);
router.get('/attendance/summary', learnerController.getAttendanceSummary);
router.get('/attendance/sessions', learnerController.getTodaySessions);
router.get('/attendance/sessions/:id', learnerController.getSessionById);
router.post('/attendance/qr/validate', learnerController.validateQr);
router.post('/attendance/mark', learnerController.markAttendance);
router.post('/attendance/verify-face', attendanceController.verifyFaceAttendance);
router.get('/attendance/history', learnerController.getAttendanceHistory);

// ══════════════════════════════════════════════════════════════════════════
// DOMAIN 10 — ASSESSMENTS & EXAMS (11 APIs)
// ══════════════════════════════════════════════════════════════════════════
router.get('/assessments', learnerController.getAssessments);
router.get('/assessments/upcoming', learnerController.getUpcomingAssessments);
router.get('/assessments/:id', learnerController.getAssessmentById);
router.post('/assessments/:id/start', learnerController.startAssessment);
router.get('/assessments/:id/questions', learnerController.getAssessmentQuestions);
router.post('/assessments/:id/answers', learnerController.saveAssessmentAnswers);
router.post('/assessments/:id/save', learnerController.saveAssessmentProgress);
router.post('/assessments/:id/submit', learnerController.submitAssessment);
router.get('/assessments/:id/result', learnerController.getAssessmentResult);
router.get('/assessments/history', learnerController.getAssessmentHistory);
router.get('/assessments/:id/review', learnerController.reviewAssessment);

// ══════════════════════════════════════════════════════════════════════════
// DOMAIN 11 — COMPLETION ENGINE (3 APIs)
// ══════════════════════════════════════════════════════════════════════════
router.get('/completion', learnerController.getCompletionStatus);
router.get('/completion/programmes/:id', learnerController.getProgrammeCompletion);
router.get('/completion/programmes/:id/requirements', learnerController.getCompletionRequirements);

// ══════════════════════════════════════════════════════════════════════════
// DOMAIN 12 — CERTIFICATES (6 APIs)
// ══════════════════════════════════════════════════════════════════════════
router.get('/certificates', learnerController.getCertificates);
router.get('/certificates/:id', learnerController.getCertificateById);
router.get('/certificates/:id/qr', learnerController.getCertificateQr);
router.get('/certificates/:id/download', learnerController.downloadCertificatePdf);
router.post('/certificates/:id/share', learnerController.shareCertificate);
router.get('/certificates/:id/verification', learnerController.verifyCertificate);

// ══════════════════════════════════════════════════════════════════════════
// DOMAIN 13 — SKILLS & COMPETENCIES (7 APIs)
// ══════════════════════════════════════════════════════════════════════════
router.get('/skills', learnerController.getSkills);
router.get('/skills/verified', learnerController.getVerifiedSkills);
router.get('/skills/in-progress', learnerController.getInProgressSkills);
router.get('/skills/gaps', learnerController.getSkillGaps);
router.get('/skills/:id', learnerController.getSkillById);
router.get('/skills/:id/evidence', learnerController.getSkillEvidence);
router.get('/skills/recommendations', learnerController.getSkillRecommendations);

// ══════════════════════════════════════════════════════════════════════════
// DOMAIN 14 — CAREER AI (7 APIs)
// ══════════════════════════════════════════════════════════════════════════
router.post('/career/ask', learnerController.askCareerAi);
router.get('/career/recommendations', learnerController.getCareerRecommendations);
router.get('/career/skill-gaps', learnerController.getCareerSkillGaps);
router.get('/career/learning-path', learnerController.getCareerLearningPath);
router.get('/career/roles', learnerController.getCareerRoles);
router.get('/career/profile', learnerController.getCareerProfile);
router.post('/career/interests', learnerController.updateCareerInterests);

// ══════════════════════════════════════════════════════════════════════════
// DOMAIN 15 — JOBS & OPPORTUNITIES (7 APIs)
// ══════════════════════════════════════════════════════════════════════════
router.get('/jobs', learnerController.getJobs);
router.get('/jobs/recommended', learnerController.getRecommendedJobs);
router.get('/jobs/:id', learnerController.getJobById);
router.post('/jobs/:id/save', learnerController.saveJob);
router.delete('/jobs/:id/save', learnerController.unsaveJob);
router.get('/jobs/saved', learnerController.getSavedJobs);
router.get('/jobs/:id/match', learnerController.getJobMatchDetails);

// ══════════════════════════════════════════════════════════════════════════
// DOMAIN 16 — JOB APPLICATIONS & EMPLOYMENT (14 APIs)
// ══════════════════════════════════════════════════════════════════════════
router.post('/job-applications', learnerController.applyForJob);
router.get('/job-applications', learnerController.getJobApplications);
router.get('/job-applications/:id', learnerController.getJobApplicationById);
router.delete('/job-applications/:id', learnerController.withdrawJobApplication);
router.get('/job-applications/:id/status', learnerController.getJobApplicationStatus);
router.get('/job-applications/:id/timeline', learnerController.getJobApplicationTimeline);
router.get('/interviews', learnerController.getInterviews);
router.get('/interviews/:id', learnerController.getInterviewById);
router.post('/interviews/:id/confirm', learnerController.confirmInterview);
router.post('/interviews/:id/reschedule', learnerController.rescheduleInterview);
router.get('/interviews/:id/documents', learnerController.getInterviewDocuments);
router.get('/employment', learnerController.getEmploymentRecord);
router.get('/employment/outcomes', learnerController.getEmploymentOutcomes);
router.post('/employment/outcomes', learnerController.submitEmploymentOutcome);

// ══════════════════════════════════════════════════════════════════════════
// DOMAIN 17 — COMMUNITY & CHALLENGES (20 APIs)
// ══════════════════════════════════════════════════════════════════════════
router.post('/community/questions', learnerController.createCommunityQuestion);
router.get('/community/questions', learnerController.getCommunityQuestions);
router.get('/community/questions/:id', learnerController.getCommunityQuestionById);
router.patch('/community/questions/:id', learnerController.updateCommunityQuestion);
router.delete('/community/questions/:id', learnerController.deleteCommunityQuestion);
router.post('/community/questions/:id/answers', learnerController.createCommunityAnswer);
router.get('/community/questions/:id/answers', learnerController.getCommunityAnswers);
router.patch('/community/answers/:id', learnerController.updateCommunityAnswer);
router.delete('/community/answers/:id', learnerController.deleteCommunityAnswer);
router.post('/community/answers/:id/upvote', learnerController.upvoteCommunityAnswer);
router.delete('/community/answers/:id/upvote', learnerController.removeUpvoteAnswer);
router.post('/community/challenges', learnerController.createCommunityChallenge);
router.get('/community/challenges', learnerController.getCommunityChallenges);
router.get('/community/challenges/:id', learnerController.getCommunityChallengeById);
router.post('/community/challenges/:id/start', learnerController.startCommunityChallenge);
router.post('/community/challenges/:id/submit', learnerController.submitCommunityChallenge);
router.get('/community/challenges/:id/result', learnerController.getCommunityChallengeResult);
router.get('/community/feed', learnerController.getCommunityFeed);
router.get('/community/trending', learnerController.getCommunityTrending);
router.post('/community/report', learnerController.reportCommunityContent);

// ══════════════════════════════════════════════════════════════════════════
// DOMAIN 18 — GAMIFICATION, NOTIFICATIONS, DOCUMENTS & SETTINGS (36 APIs)
// ══════════════════════════════════════════════════════════════════════════
router.get('/gamification/profile', learnerController.getGamificationProfile);
router.get('/gamification/points', learnerController.getPoints);
router.post('/gamification/points/award', learnerController.awardPoints);
router.get('/gamification/points/history', learnerController.getPointsHistory);
router.get('/gamification/level', learnerController.getLevelInfo);
router.get('/gamification/streak', learnerController.getStreakInfo);
router.get('/gamification/badges', learnerController.getBadges);
router.get('/gamification/achievements', learnerController.getAchievements);
router.get('/gamification/leaderboard', learnerController.getLeaderboard);
router.get('/gamification/leaderboard/me', learnerController.getMyLeaderboardRank);
router.get('/gamification/weekly', learnerController.getWeeklyDashboard);
router.get('/gamification/rewards', learnerController.getRewardsCatalog);
router.post('/gamification/rewards/:id/claim', learnerController.claimReward);

router.get('/notifications', learnerController.getNotifications);
router.get('/notifications/unread', learnerController.getUnreadNotificationsCount);
router.patch('/notifications/:id/read', learnerController.markNotificationRead);
router.post('/notifications/read-all', learnerController.markAllNotificationsRead);
router.delete('/notifications/:id', learnerController.deleteNotification);
router.get('/notifications/preferences', learnerController.getNotificationPreferences);
router.patch('/notifications/preferences', learnerController.updateNotificationPreferences);

router.get('/documents', learnerController.getDocuments);
router.post('/documents', learnerController.uploadDocument);
router.get('/documents/:id', learnerController.getDocumentById);
router.delete('/documents/:id', learnerController.deleteDocument);
router.get('/documents/:id/download', learnerController.downloadDocument);

router.post('/support/tickets', learnerController.createSupportTicket);
router.get('/support/tickets', learnerController.getSupportTickets);
router.get('/support/tickets/:id', learnerController.getSupportTicketById);
router.post('/support/tickets/:id/messages', learnerController.addSupportMessage);

router.get('/settings', learnerController.getSettings);
router.patch('/settings', learnerController.updateSettings);
router.get('/settings/language', learnerController.getLanguageSettings);
router.patch('/settings/language', learnerController.updateLanguageSettings);
router.get('/settings/privacy', learnerController.getPrivacySettings);
router.patch('/settings/privacy', learnerController.updatePrivacySettings);
router.get('/settings/storage', learnerController.getStorageSettings);
router.post('/settings/clear-cache', learnerController.clearCache);

export default router;
