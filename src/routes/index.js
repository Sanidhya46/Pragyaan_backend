import express from 'express';
import { authController } from '../controllers/auth.controller.js';
import { instituteController } from '../controllers/institute.controller.js';
import { programmeController } from '../controllers/programme.controller.js';
import { batchController } from '../controllers/batch.controller.js';
import { enrollmentController } from '../controllers/enrollment.controller.js';
import { lmsController } from '../controllers/lms.controller.js';
import { attendanceController } from '../controllers/attendance.controller.js';
import { assessmentController } from '../controllers/assessment.controller.js';
import { certificateController } from '../controllers/certificate.controller.js';
import { skillController } from '../controllers/skill.controller.js';
import { employmentController } from '../controllers/employment.controller.js';
import { aiController } from '../controllers/ai.controller.js';
import { analyticsController } from '../controllers/analytics.controller.js';
import { deviceController } from '../controllers/device.controller.js';
import { syncController } from '../controllers/sync.controller.js';
import { operationsController } from '../controllers/operations.controller.js';
import { gamificationController } from '../controllers/gamification.controller.js';
import { nodesController } from '../controllers/nodes.controller.js';
import { adminController } from '../controllers/admin.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/role.middleware.js';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'PRAGYAAN Central API Gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Auth Routes
const authRouter = express.Router();
authRouter.post('/register', authController.register);
authRouter.post('/login', authController.login);
authRouter.post('/refresh-token', authController.refreshToken);
authRouter.get('/me', authenticate, authController.me);
authRouter.post('/switch-role', authenticate, authController.switchRole);
authRouter.get('/pending-institutes', authenticate, authController.getPendingInstitutes);
authRouter.put('/approve-institute/:instituteId', authenticate, authController.approveInstitute);
router.use('/auth', authRouter);

// Institute Routes
const instRouter = express.Router();
instRouter.get('/', instituteController.getAll);
instRouter.get('/:instituteId', instituteController.getById);
instRouter.put('/:instituteId/infrastructure', authenticate, authorize('SUPER_ADMIN', 'NCCT_HQ_ADMIN', 'INSTITUTE_DIRECTOR', 'INSTITUTE_ADMIN'), instituteController.updateInfrastructure);
router.use('/institutes', instRouter);

// Programme Routes
const progRouter = express.Router();
progRouter.get('/', programmeController.getAll);
progRouter.get('/:programmeId', programmeController.getById);
progRouter.post('/', authenticate, authorize('SUPER_ADMIN', 'NCCT_HQ_ADMIN', 'INSTITUTE_DIRECTOR', 'INSTITUTE_ADMIN', 'PROGRAMME_COORDINATOR'), programmeController.create);
progRouter.put('/:programmeId/status', authenticate, authorize('SUPER_ADMIN', 'NCCT_HQ_ADMIN', 'INSTITUTE_DIRECTOR'), programmeController.updateStatus);
router.use('/programmes', progRouter);

// Batch Routes
const batchRouter = express.Router();
batchRouter.get('/', batchController.getAll);
batchRouter.post('/', authenticate, authorize('SUPER_ADMIN', 'INSTITUTE_ADMIN', 'PROGRAMME_COORDINATOR'), batchController.create);
router.use('/batches', batchRouter);

// Enrollment Routes
const enrRouter = express.Router();
enrRouter.post('/register', authenticate, enrollmentController.register);
enrRouter.get('/my', authenticate, enrollmentController.getMyEnrollments);
enrRouter.get('/all', authenticate, authorize('SUPER_ADMIN', 'NCCT_HQ_ADMIN', 'INSTITUTE_DIRECTOR', 'INSTITUTE_ADMIN', 'PROGRAMME_COORDINATOR'), enrollmentController.getAll);
enrRouter.put('/:enrollmentId/status', authenticate, authorize('SUPER_ADMIN', 'INSTITUTE_DIRECTOR', 'INSTITUTE_ADMIN', 'PROGRAMME_COORDINATOR'), enrollmentController.updateStatus);
router.use('/enrollments', enrRouter);

// LMS Routes
const lmsRouter = express.Router();
lmsRouter.get('/courses', lmsController.getCourses);
lmsRouter.get('/courses/:courseId', lmsController.getCourseById);
lmsRouter.get('/package/:courseId', lmsController.getCourseOfflinePackage);
lmsRouter.post('/progress', authenticate, lmsController.updateProgress);
lmsRouter.get('/progress/my', authenticate, lmsController.getMyProgress);
router.use('/lms', lmsRouter);

// Attendance Routes
const attRouter = express.Router();
attRouter.post('/session/start', authenticate, authorize('SUPER_ADMIN', 'TRAINER_FACULTY', 'PROGRAMME_COORDINATOR'), attendanceController.startSession);
attRouter.post('/check-in', optionalAuth, attendanceController.checkInViaQR);
attRouter.post('/edge-event', attendanceController.recordEdgeEvent); // Called by Edge node
attRouter.get('/live-session', attendanceController.getLiveSession);
attRouter.get('/session/:sessionId/records', attendanceController.getSessionRecords);
attRouter.post('/verify-face', attendanceController.verifyFaceAttendance);
attRouter.get('/batch/:batchId', authenticate, attendanceController.getBatchAttendance);
router.use('/attendance', attRouter);

// Assessment Routes
const asmRouter = express.Router();
asmRouter.get('/programme/:programmeId', assessmentController.getByProgramme);
asmRouter.post('/submit', authenticate, assessmentController.submitAttempt);
router.use('/assessments', asmRouter);

// Certificate Routes
const certRouter = express.Router();
certRouter.post('/generate', authenticate, authorize('SUPER_ADMIN', 'NCCT_HQ_ADMIN', 'INSTITUTE_DIRECTOR', 'ASSESSMENT_OFFICER'), certificateController.generate);
certRouter.get('/my', authenticate, certificateController.getMyCertificates);
certRouter.get('/public/verify/:credentialId', certificateController.verifyPublic); // Public verification without auth
router.use('/certificates', certRouter);

// Skill Routes
const skillRouter = express.Router();
skillRouter.get('/taxonomy', skillController.getTaxonomy);
skillRouter.get('/trainee/:traineeId?', authenticate, skillController.getTraineeSkills);
router.use('/skills', skillRouter);

// Employment Routes
const empRouter = express.Router();
empRouter.get('/vacancies', employmentController.getVacancies);
empRouter.post('/vacancies', authenticate, authorize('SUPER_ADMIN', 'EMPLOYER_RECRUITER', 'PLACEMENT_OFFICER'), employmentController.createVacancy);
empRouter.get('/vacancies/matched', authenticate, employmentController.getMatchedVacancies);
empRouter.post('/apply', authenticate, employmentController.applyForJob);
empRouter.get('/applications/my', authenticate, employmentController.getMyApplications);
empRouter.get('/outcomes', employmentController.getOutcomes);
empRouter.post('/outcomes', authenticate, authorize('SUPER_ADMIN', 'PLACEMENT_OFFICER', 'INSTITUTE_DIRECTOR'), employmentController.recordOutcome);
router.use('/employment', empRouter);

// AI Career Engine Routes
const aiRouter = express.Router();
aiRouter.post('/career-chat', optionalAuth, aiController.getCareerGuidance);
aiRouter.post('/skill-gap', optionalAuth, aiController.getSkillGapAnalysis);
router.use('/ai', aiRouter);

// Analytics Routes
const anaRouter = express.Router();
anaRouter.get('/hq-overview', analyticsController.getHQOverview);
router.use('/analytics', anaRouter);

// Device Routes
const devRouter = express.Router();
devRouter.post('/heartbeat', deviceController.registerOrHeartbeat);
devRouter.get('/', authenticate, authorize('SUPER_ADMIN', 'NCCT_HQ_ADMIN', 'IT_EDGE_OPERATOR'), deviceController.getAllDevices);
router.use('/devices', devRouter);

// Edge & Mobile Sync Routes
const syncRouter = express.Router();
syncRouter.post('/batch', syncController.processBatch);
router.use('/sync', syncRouter);

// Operations & ERP Routes (Features 13, 16, 20, 21, 22, 23, 32, 59, 61, 70, 73, 77, 81, 83)
const opsRouter = express.Router();
opsRouter.get('/timetable', operationsController.getTimetable);
opsRouter.post('/timetable/schedule', authenticate, operationsController.scheduleSession);
opsRouter.get('/hostels', operationsController.getHostels);
opsRouter.post('/hostels/allocate', authenticate, operationsController.allocateHostelBed);
opsRouter.put('/hostels/status/:allocationId', authenticate, operationsController.updateHostelStatus);
opsRouter.get('/logistics', operationsController.getLogistics);
opsRouter.post('/logistics/task', authenticate, operationsController.createLogisticsTask);
opsRouter.put('/logistics/task/:taskId/status', authenticate, operationsController.updateLogisticsTaskStatus);
opsRouter.get('/budget', operationsController.getBudget);
opsRouter.get('/audit-logs', authenticate, operationsController.getAuditLogs);
opsRouter.get('/notifications', authenticate, operationsController.getNotifications);
opsRouter.post('/feedback', operationsController.submitFeedback);
opsRouter.post('/duplicate-check', operationsController.checkDuplicate);
opsRouter.post('/attendance-correction', authenticate, operationsController.requestAttendanceCorrection);
opsRouter.post('/nominate', authenticate, operationsController.submitNomination);
opsRouter.get('/tna-heatmap', operationsController.getTNAHeatmap);
router.use('/operations', opsRouter);

// Gamification Engine Routes (Features 8, 9, 10, 11)
const gamifyRouter = express.Router();
gamifyRouter.get('/skill-tree/:traineeId?', gamificationController.getSkillTree);
gamifyRouter.get('/streaks-badges/:traineeId?', gamificationController.getStreaksAndBadges);
gamifyRouter.get('/squads', gamificationController.getSquads);
gamifyRouter.post('/squads/join', gamificationController.joinSquad);
gamifyRouter.get('/assessments', gamificationController.getAssessments);
gamifyRouter.post('/assessments', gamificationController.createAssessment);
gamifyRouter.post('/assessment/submit', gamificationController.submitAssessmentAttempt);
router.use('/gamification', gamifyRouter);

// Living India Map, TNA Simulator & 20 Nodes Telemetry Routes (Features 1, 2, 3, 4, 5, 6, 18, 19, 20)
const nodesRouter = express.Router();
nodesRouter.get('/india-map', nodesController.getIndiaMapNodes);
nodesRouter.post('/pull-the-plug', nodesController.togglePullThePlug);
nodesRouter.post('/tna-simulate', nodesController.simulateTNA);
nodesRouter.get('/xray-funnel', nodesController.getXRayFunnel);
nodesRouter.get('/skill-gap-heatmap', nodesController.getSkillGapHeatmap);
nodesRouter.get('/coe-journey', nodesController.getCoEJourney);
nodesRouter.get('/tamper-ledger', nodesController.getTamperLedger);
nodesRouter.get('/explainable-matches', nodesController.getExplainableMatches);
router.use('/nodes', nodesRouter);

// Super Admin Master Governance & Whole Database User Routes
import adminRoutes from './admin.routes.js';
router.use('/admin', adminRoutes);

// Institute & Partner Portal Scoped Governance Routes
import partnerRoutes from './partner.routes.js';
router.use('/partner', partnerRoutes);

// Learner App & Student Portal Comprehensive Scoped Routes (18 Domains, 180 APIs)
import learnerRoutes from './learner.routes.js';
router.use('/learner', learnerRoutes);

export default router;
