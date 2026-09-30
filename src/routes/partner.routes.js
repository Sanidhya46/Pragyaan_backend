import express from 'express';
import { partnerController } from '../controllers/partner.controller.js';

const router = express.Router();

/**
 * Partner Portal Context & Auth Middleware
 * Extracts: userId, application, role, organizationId, instituteIds, programmeIds, permissions
 */
router.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  const roleHeader = req.headers['x-pragyaan-role'];
  const instituteHeader = req.headers['x-pragyaan-institute'];

  req.partnerContext = {
    userId: 'USR-PARTNER-ACTIVE',
    application: 'INSTITUTE_PARTNER',
    role: roleHeader || 'TRAINER_FACULTY',
    organizationId: 'ORG-001',
    instituteIds: [instituteHeader || 'INST-VAMNICOM-01'],
    programmeIds: ['PRG-PACS-01', 'PRG-PGDM-02'],
    permissions: [
      'PROGRAMME_VIEW',
      'BATCH_MANAGE',
      'ATTENDANCE_VIEW',
      'ATTENDANCE_START',
      'VACANCY_MANAGE',
      'CANDIDATE_VIEW',
    ],
  };
  next();
});

// 1. Dashboard
router.get('/dashboard/overview', partnerController.getDashboardOverview);
router.get('/dashboard/kpis', partnerController.getDashboardKpis);
router.get('/dashboard/tasks', partnerController.getTasks);
router.get('/dashboard/alerts', partnerController.getDashboardOverview);
router.get('/dashboard/activity', partnerController.getDashboardOverview);
router.get('/dashboard/trends', partnerController.getRoleAnalytics);

// 2. My Tasks
router.get('/tasks', partnerController.getTasks);
router.get('/tasks/pending', partnerController.getTasks);
router.patch('/tasks/:taskId/status', partnerController.updateTaskStatus);

// 3. Notifications
router.get('/notifications', partnerController.getNotifications);

// 4. Programmes
router.get('/programmes', partnerController.getProgrammes);
router.post('/programmes', partnerController.createProgramme);
router.get('/programmes/:programmeId', partnerController.getProgrammes);
router.get('/programmes/:programmeId/courses', partnerController.getProgrammes);
router.get('/programmes/:programmeId/performance', partnerController.getProgrammes);

// 5. Batches
router.get('/batches', partnerController.getBatches);
router.get('/batches/:batchId', partnerController.getBatches);
router.get('/batches/:batchId/participants', partnerController.getParticipants);

// 6. Participants, Learners & Candidates
router.get('/participants', partnerController.getParticipants);
router.get('/my-learners', partnerController.getParticipants);
router.get('/career/learners', partnerController.getParticipants);
router.get('/candidates', partnerController.getMatchedCandidates);
router.get('/candidates/recommended', partnerController.getMatchedCandidates);

// 7. Trainee 360
router.get('/trainees/:traineeId', partnerController.getTrainee360);
router.get('/trainees/:traineeId/timeline', partnerController.getTrainee360);

// 8. Schedule / Timetable
router.get('/schedule', partnerController.getSchedule);
router.get('/schedule/sessions', partnerController.getSchedule);

// 9. Attendance & Dynamic Rolling QR Cockpit
router.post('/attendance/sessions/:sessionId/start', partnerController.startAttendanceSession);
router.get('/attendance/sessions/:sessionId/qr', partnerController.startAttendanceSession);
router.post('/attendance/sessions/:sessionId/qr/rotate', partnerController.rotateQrToken);
router.post('/attendance/sessions/:sessionId/close', partnerController.closeAttendanceSession);

// 10. Vacancies & Candidate Matching
router.get('/vacancies', partnerController.getVacancies);
router.post('/vacancies', partnerController.createVacancy);
router.get('/vacancies/:vacancyId/candidates', partnerController.getMatchedCandidates);

// 11. Job Applications
router.get('/job-applications', partnerController.getJobApplications);
router.patch('/job-applications/:id/status', partnerController.updateApplicationStatus);

// 12. Hostels
router.get('/hostels', partnerController.getHostels);

// 13. Devices & Edge Nodes
router.get('/devices', partnerController.getDevices);
router.get('/edge/nodes', partnerController.getDevices);

// 14. Certificates
router.get('/certificates', partnerController.getCertificates);

// 15. Skills
router.get('/skills', partnerController.getSkills);
router.get('/skills/tree', partnerController.getSkills);

// 16. Analytics
router.get('/analytics/institute', partnerController.getRoleAnalytics);
router.get('/analytics/training', partnerController.getRoleAnalytics);
router.get('/analytics/employment', partnerController.getRoleAnalytics);

export default router;
