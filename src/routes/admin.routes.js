import express from 'express';
import { User } from '../models/User.model.js';
import { Institute } from '../models/Institute.model.js';
import { Programme } from '../models/Programme.model.js';
import { Batch } from '../models/Batch.model.js';
import { Certificate } from '../models/Certificate.model.js';
import { Device } from '../models/Device.model.js';
import { Vacancy, JobApplication, EmploymentOutcome } from '../models/Employment.model.js';
import { Course, UserProgress as LearningProgress } from '../models/Lms.model.js';
import { AttendanceSession, Attendance as AttendanceRecord } from '../models/Attendance.model.js';
import { Assessment, AssessmentAttempt } from '../models/Assessment.model.js';
import { Skill, TraineeSkill as SkillProfile } from '../models/Skill.model.js';
import { Classroom, SessionSchedule } from '../models/Timetable.model.js';
import { HostelBlock, HostelAllocation } from '../models/Hostel.model.js';
import { ProgrammeBudget } from '../models/Finance.model.js';
import { AuditLog, Notification } from '../models/AuditNotification.model.js';
import { Enrollment } from '../models/Enrollment.model.js';
import { sendAdminSuccess, sendAdminError, recordAdminAudit } from '../utils/response.util.js';
import { adminController } from '../controllers/admin.controller.js';

const router = express.Router();

// Helper to paginate array or mongoose query
const paginateArray = (items, page = 1, limit = 20) => {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.max(1, Number(limit) || 20);
  const total = items.length;
  const totalPages = Math.ceil(total / l) || 1;
  const paginated = items.slice((p - 1) * l, p * l);
  return {
    data: paginated,
    pagination: {
      page: p,
      limit: l,
      total,
      totalPages,
      hasNext: p < totalPages,
      hasPrevious: p > 1,
    }
  };
};

// Generic Operational Data Route
router.get('/modules/data', adminController.getModuleData);

/* ══════════════════════════════════════════════════════════════════════════
   1. 🌐 OVERVIEW (23 Unique APIs)
   ══════════════════════════════════════════════════════════════════════════ */
// 1. GET /dashboard/overview
router.get('/dashboard/overview', adminController.getEcosystemOverview);

// 2. GET /dashboard/kpis
router.get('/dashboard/kpis', async (req, res) => {
  try {
    const [institutesCount, learnersCount, programmesCount, batchesCount, certsCount] = await Promise.all([
      Institute.countDocuments(),
      User.countDocuments({ role: 'TRAINEE' }),
      Programme.countDocuments(),
      Batch.countDocuments(),
      Certificate.countDocuments(),
    ]);
    return sendAdminSuccess(res, {
      kpis: {
        totalInstitutes: institutesCount || 20,
        activeInstitutes: institutesCount || 20,
        onlineInstitutes: (institutesCount || 20) - 1,
        totalLearners: learnersCount || 12480,
        activeProgrammes: programmesCount || 186,
        activeBatches: batchesCount || 342,
        attendanceRate: 91.4,
        completionRate: 82.7,
        certificatesIssued: certsCount || 9420,
        careerReadyLearners: 6830,
        activeEmployers: 428,
        employmentOutcomes: 2184,
      }
    });
  } catch (e) {
    return sendAdminError(res, 'OVERVIEW_KPI_ERROR', e.message);
  }
});

// 3. GET /dashboard/map
router.get('/dashboard/map', async (req, res) => {
  try {
    const institutes = await Institute.find().lean();
    return sendAdminSuccess(res, { nodes: institutes });
  } catch (e) {
    return sendAdminError(res, 'MAP_ERROR', e.message);
  }
});

// 4. GET /dashboard/pipeline
router.get('/dashboard/pipeline', (req, res) => {
  return sendAdminSuccess(res, {
    stages: [
      { id: 'REGISTRATION', label: 'Registration', count: 14500, conversionRate: 100 },
      { id: 'ELIGIBILITY', label: 'Eligibility', count: 13800, conversionRate: 95.1 },
      { id: 'ENROLLMENT', label: 'Enrollment', count: 12480, conversionRate: 90.4 },
      { id: 'LEARNING', label: 'Learning', count: 11200, conversionRate: 89.7 },
      { id: 'ASSESSMENT', label: 'Assessment', count: 10150, conversionRate: 90.6 },
      { id: 'CERTIFICATION', label: 'Certification', count: 9420, conversionRate: 92.8 },
      { id: 'SKILLS', label: 'Skills Verified', count: 8750, conversionRate: 92.8 },
      { id: 'CAREER', label: 'Career Advisory', count: 6830, conversionRate: 78.0 },
      { id: 'EMPLOYMENT', label: 'Employment Outcome', count: 2184, conversionRate: 31.9 },
    ]
  });
});

// 5. GET /dashboard/alerts
router.get('/dashboard/alerts', (req, res) => {
  return sendAdminSuccess(res, {
    alerts: [
      { id: 'ALT-01', level: 'HIGH', title: '3 Edge Nodes Synced via Fallback', timestamp: new Date() },
      { id: 'ALT-02', level: 'MEDIUM', title: 'PAC Approval Due for Q3 Calendar', timestamp: new Date() },
    ]
  });
});

// 6. GET /institute-network
router.get('/institute-network', async (req, res) => {
  try {
    const list = await Institute.find().lean();
    const result = paginateArray(list, req.query.page, req.query.limit);
    return sendAdminSuccess(res, result.data, result.pagination);
  } catch (e) {
    return sendAdminError(res, 'NETWORK_ERROR', e.message);
  }
});

// 7. GET /institute-network/:instituteId
router.get('/institute-network/:instituteId', async (req, res) => {
  try {
    const inst = await Institute.findOne({
      $or: [{ instituteId: req.params.instituteId }, { code: req.params.instituteId }]
    }).lean();
    if (!inst) return sendAdminError(res, 'NOT_FOUND', 'Institute not found', 404);
    return sendAdminSuccess(res, inst);
  } catch (e) {
    return sendAdminError(res, 'INSTITUTE_ERROR', e.message);
  }
});

// 8. GET /dashboard/training-kpis
router.get('/dashboard/training-kpis', (req, res) => {
  return sendAdminSuccess(res, {
    attendanceRate: 91.2,
    completionRate: 83.1,
    enrollmentCount: 12480,
    assessmentPassRate: 79.8,
    certificateCount: 9420,
    employmentCount: 2184,
  });
});

// 9. GET /dashboard/training-kpis/trends
router.get('/dashboard/training-kpis/trends', (req, res) => {
  return sendAdminSuccess(res, {
    trends: [
      { month: 'Apr', attendanceRate: 89.2, completionRate: 81.0 },
      { month: 'May', attendanceRate: 90.1, completionRate: 82.3 },
      { month: 'Jun', attendanceRate: 91.4, completionRate: 82.7 },
      { month: 'Jul', attendanceRate: 92.0, completionRate: 83.5 },
    ]
  });
});

// 10. GET /dashboard/training-kpis/institutes
router.get('/dashboard/training-kpis/institutes', async (req, res) => {
  try {
    const institutes = await Institute.find().select('instituteId name state attendanceRate completionRate').lean();
    return sendAdminSuccess(res, institutes);
  } catch (e) {
    return sendAdminError(res, 'INSTITUTE_KPIS_ERROR', e.message);
  }
});

// 11. GET /alerts
router.get('/alerts', (req, res) => {
  const alerts = [
    { alertId: 'ALT-101', type: 'ATTENDANCE_DROP', severity: 'WARNING', message: 'Attendance below 75% at ICM Imphal', createdAt: new Date() },
    { alertId: 'ALT-102', type: 'EDGE_OFFLINE', severity: 'CRITICAL', message: 'Smart Training Node STN-018 offline', createdAt: new Date() },
  ];
  const result = paginateArray(alerts, req.query.page, req.query.limit);
  return sendAdminSuccess(res, result.data, result.pagination);
});

// 12. GET /tasks
router.get('/tasks', (req, res) => {
  const tasks = [
    { taskId: 'TASK-001', title: 'Review partner approval', type: 'PARTNER_APPROVAL', priority: 'HIGH', status: 'PENDING', assignedTo: { userId: 'USR-00001', name: 'Super Admin' }, dueAt: '2026-09-30T12:00:00Z', createdAt: new Date() },
    { taskId: 'TASK-002', title: 'Audit ICM Dehradun edge storage', type: 'EDGE_AUDIT', priority: 'MEDIUM', status: 'IN_PROGRESS', assignedTo: { userId: 'USR-00001', name: 'Super Admin' }, dueAt: '2026-10-02T12:00:00Z', createdAt: new Date() },
  ];
  const result = paginateArray(tasks, req.query.page, req.query.limit);
  return sendAdminSuccess(res, result.data, result.pagination);
});

// 13. PATCH /tasks/:taskId
router.patch('/tasks/:taskId', async (req, res) => {
  await recordAdminAudit({
    action: 'TASK_UPDATED',
    entityType: 'TASK',
    entityId: req.params.taskId,
    req,
    newState: req.body,
  });
  return sendAdminSuccess(res, { taskId: req.params.taskId, ...req.body, updatedAt: new Date() });
});

// 14. POST /tasks/:taskId/assign
router.post('/tasks/:taskId/assign', async (req, res) => {
  await recordAdminAudit({
    action: 'TASK_ASSIGNED',
    entityType: 'TASK',
    entityId: req.params.taskId,
    req,
    newState: req.body,
  });
  return sendAdminSuccess(res, { taskId: req.params.taskId, assignedTo: req.body.assignedTo, assignedAt: new Date() });
});

// 15. GET /tasks/pending
router.get('/tasks/pending', (req, res) => {
  const tasks = [
    { taskId: 'TASK-001', title: 'Review partner approval for AMUL Federation', type: 'PARTNER_APPROVAL', priority: 'HIGH', status: 'PENDING', dueAt: '2026-09-30T12:00:00Z' },
  ];
  const result = paginateArray(tasks, req.query.page, req.query.limit);
  return sendAdminSuccess(res, result.data, result.pagination);
});

// 16. GET /tasks/audits
router.get('/tasks/audits', (req, res) => {
  const tasks = [
    { taskId: 'TASK-AUD-01', title: 'Statutory Training Compliance Audit', type: 'AUDIT', priority: 'HIGH', status: 'IN_PROGRESS' },
  ];
  const result = paginateArray(tasks, req.query.page, req.query.limit);
  return sendAdminSuccess(res, result.data, result.pagination);
});

// 17. GET /tasks/compliance
router.get('/tasks/compliance', (req, res) => {
  const tasks = [
    { taskId: 'TASK-COMP-01', title: 'PAC Curriculum Version Verification', type: 'COMPLIANCE', priority: 'MEDIUM', status: 'PENDING' },
  ];
  const result = paginateArray(tasks, req.query.page, req.query.limit);
  return sendAdminSuccess(res, result.data, result.pagination);
});

// 18. PATCH /tasks/:taskId/status
router.patch('/tasks/:taskId/status', async (req, res) => {
  await recordAdminAudit({
    action: 'TASK_STATUS_CHANGED',
    entityType: 'TASK',
    entityId: req.params.taskId,
    req,
    newState: { status: req.body.status },
  });
  return sendAdminSuccess(res, { taskId: req.params.taskId, status: req.body.status || 'COMPLETED', updatedAt: new Date() });
});

// 19. GET /search
router.get('/search', async (req, res) => {
  try {
    const q = req.query.q || '';
    const regex = new RegExp(q, 'i');
    const [users, institutes, programmes] = await Promise.all([
      User.find({ $or: [{ name: regex }, { email: regex }, { userId: regex }] }).limit(5).lean(),
      Institute.find({ $or: [{ name: regex }, { state: regex }] }).limit(5).lean(),
      Programme.find({ name: regex }).limit(5).lean(),
    ]);

    const results = [
      ...users.map(u => ({ entityType: 'USER', entityId: u.userId, title: u.name, subtitle: `${u.role} • ${u.instituteId}`, status: u.status, url: `/admin?subOption=All%20Users` })),
      ...institutes.map(i => ({ entityType: 'INSTITUTE', entityId: i.instituteId || i.code, title: i.name, subtitle: `${i.state} • ${i.city}`, status: i.status, url: `/admin?subOption=20%20Constituent%20Institutes` })),
      ...programmes.map(p => ({ entityType: 'PROGRAMME', entityId: p.programmeId, title: p.name, subtitle: `${p.category} • ${p.durationHours || 40} hrs`, status: p.status, url: `/admin?subOption=Programme%20Master` })),
    ];
    return sendAdminSuccess(res, { query: q, results });
  } catch (e) {
    return sendAdminError(res, 'SEARCH_ERROR', e.message);
  }
});

// 20. GET /notifications
router.get('/notifications', async (req, res) => {
  try {
    const notifs = await Notification.find().sort({ createdAt: -1 }).lean();
    const result = paginateArray(notifs.length ? notifs : [
      { notificationId: 'NOTIF-01', title: 'PAC Schedule Approved', message: 'Annual Training Calendar approved.', severity: 'INFO', isRead: false, createdAt: new Date() },
      { notificationId: 'NOTIF-02', title: 'Edge Telemetry Healthy', message: 'All 20 STN nodes reporting normal sync.', severity: 'INFO', isRead: true, createdAt: new Date() },
    ], req.query.page, req.query.limit);
    return sendAdminSuccess(res, result.data, result.pagination);
  } catch (e) {
    return sendAdminError(res, 'NOTIF_ERROR', e.message);
  }
});

// 21. PATCH /notifications/:id/read
router.patch('/notifications/:id/read', async (req, res) => {
  await Notification.updateOne({ notificationId: req.params.id }, { $set: { isRead: true } });
  return sendAdminSuccess(res, { notificationId: req.params.id, isRead: true });
});

// 22. PATCH /notifications/:id/archive
router.patch('/notifications/:id/archive', async (req, res) => {
  await Notification.updateOne({ notificationId: req.params.id }, { $set: { isArchived: true } });
  return sendAdminSuccess(res, { notificationId: req.params.id, isArchived: true });
});

// 23. POST /notifications/:id/acknowledge
router.post('/notifications/:id/acknowledge', async (req, res) => {
  await recordAdminAudit({
    action: 'NOTIFICATION_ACKNOWLEDGED',
    entityType: 'NOTIFICATION',
    entityId: req.params.id,
    req,
  });
  return sendAdminSuccess(res, { notificationId: req.params.id, acknowledged: true, acknowledgedAt: new Date() });
});

/* ══════════════════════════════════════════════════════════════════════════
   2. 🏛️ ECOSYSTEM (30 Unique APIs)
   ══════════════════════════════════════════════════════════════════════════ */
// 24. GET /organizations/tree
router.get('/organizations/tree', (req, res) => {
  return sendAdminSuccess(res, {
    tree: {
      organizationId: 'ORG-001',
      name: 'NCCT Headquarters (New Delhi)',
      type: 'APEX_HQ',
      children: [
        {
          organizationId: 'REG-NORTH',
          name: 'Northern Regional Directorate',
          children: [
            { organizationId: 'INST-ICM-LKO', name: 'ICM Lucknow' },
            { organizationId: 'INST-ICM-DEHRADUN', name: 'ICM Dehradun' },
          ]
        },
        {
          organizationId: 'REG-WEST',
          name: 'Western Regional Directorate',
          children: [
            { organizationId: 'INST-VAMNICOM', name: 'VAMNICOM Pune (Apex)' },
            { organizationId: 'INST-RICM-GANDHI', name: 'RICM Gandhinagar' },
          ]
        }
      ]
    }
  });
});

// 25. GET /organizations
router.get('/organizations', (req, res) => {
  const orgs = [
    { organizationId: 'ORG-001', name: 'NCCT Headquarters', type: 'HQ', status: 'ACTIVE', state: 'New Delhi', city: 'New Delhi', instituteCount: 20 },
    { organizationId: 'ORG-002', name: 'IFFCO Kisan Nodal Wing', type: 'COOPERATIVE_FEDERATION', status: 'ACTIVE', state: 'New Delhi', city: 'New Delhi', instituteCount: 4 },
    { organizationId: 'ORG-003', name: 'Gujarat Co-operative Milk Marketing Federation (Amul)', type: 'PARTNER_ORGANIZATION', status: 'ACTIVE', state: 'Gujarat', city: 'Anand', instituteCount: 3 },
  ];
  const result = paginateArray(orgs, req.query.page, req.query.limit);
  return sendAdminSuccess(res, result.data, result.pagination);
});

// 26. GET /organizations/:id
router.get('/organizations/:id', (req, res) => {
  return sendAdminSuccess(res, {
    organizationId: req.params.id,
    name: 'NCCT Headquarters',
    type: 'HQ',
    status: 'ACTIVE',
    contact: { email: 'admin@pragyaan.gov.in', phone: '+91 11 2686 2155' },
    institutes: ['INST-VAMNICOM', 'INST-RICM-JAIPUR'],
  });
});

// 27. POST /organizations
router.post('/organizations', async (req, res) => {
  await recordAdminAudit({ action: 'ORGANIZATION_CREATED', entityType: 'ORGANIZATION', entityId: req.body.organizationId || 'ORG-NEW', req });
  return sendAdminSuccess(res, { organizationId: req.body.organizationId || 'ORG-NEW', ...req.body, createdAt: new Date() }, null, 201);
});

// 28. PATCH /organizations/:id
router.patch('/organizations/:id', async (req, res) => {
  await recordAdminAudit({ action: 'ORGANIZATION_UPDATED', entityType: 'ORGANIZATION', entityId: req.params.id, req, newState: req.body });
  return sendAdminSuccess(res, { organizationId: req.params.id, ...req.body, updatedAt: new Date() });
});

// 29. PATCH /organizations/:id/status
router.patch('/organizations/:id/status', async (req, res) => {
  await recordAdminAudit({ action: 'ORGANIZATION_STATUS_CHANGED', entityType: 'ORGANIZATION', entityId: req.params.id, req, newState: { status: req.body.status } });
  return sendAdminSuccess(res, { organizationId: req.params.id, status: req.body.status || 'ACTIVE' });
});

// 30. GET /institutes
router.get('/institutes', async (req, res) => {
  try {
    const list = await Institute.find().lean();
    const result = paginateArray(list, req.query.page, req.query.limit);
    return sendAdminSuccess(res, result.data, result.pagination);
  } catch (e) {
    return sendAdminError(res, 'INSTITUTES_GET_ERROR', e.message);
  }
});

// 31. GET /institutes/:instituteId
router.get('/institutes/:instituteId', async (req, res) => {
  try {
    const inst = await Institute.findOne({
      $or: [{ instituteId: req.params.instituteId }, { code: req.params.instituteId }]
    }).lean();
    if (!inst) return sendAdminError(res, 'NOT_FOUND', 'Institute not found', 404);
    return sendAdminSuccess(res, inst);
  } catch (e) {
    return sendAdminError(res, 'INSTITUTE_ERROR', e.message);
  }
});

// 32. POST /institutes
router.post('/institutes', async (req, res) => {
  try {
    const inst = new Institute(req.body);
    await inst.save();
    await recordAdminAudit({ action: 'INSTITUTE_CREATED', entityType: 'INSTITUTE', entityId: inst.instituteId, req });
    return sendAdminSuccess(res, inst, null, 201);
  } catch (e) {
    return sendAdminError(res, 'INSTITUTE_CREATE_ERROR', e.message);
  }
});

// 33. PATCH /institutes/:instituteId
router.patch('/institutes/:instituteId', async (req, res) => {
  try {
    const updated = await Institute.findOneAndUpdate(
      { $or: [{ instituteId: req.params.instituteId }, { code: req.params.instituteId }] },
      { $set: req.body },
      { new: true }
    );
    await recordAdminAudit({ action: 'INSTITUTE_UPDATED', entityType: 'INSTITUTE', entityId: req.params.instituteId, req, newState: req.body });
    return sendAdminSuccess(res, updated);
  } catch (e) {
    return sendAdminError(res, 'INSTITUTE_UPDATE_ERROR', e.message);
  }
});

// 34. PATCH /institutes/:instituteId/status
router.patch('/institutes/:instituteId/status', async (req, res) => {
  try {
    const updated = await Institute.findOneAndUpdate(
      { $or: [{ instituteId: req.params.instituteId }, { code: req.params.instituteId }] },
      { $set: { status: req.body.status } },
      { new: true }
    );
    await recordAdminAudit({ action: 'INSTITUTE_STATUS_CHANGED', entityType: 'INSTITUTE', entityId: req.params.instituteId, req, newState: { status: req.body.status } });
    return sendAdminSuccess(res, updated);
  } catch (e) {
    return sendAdminError(res, 'INSTITUTE_STATUS_ERROR', e.message);
  }
});

// 35. GET /institutes/:instituteId/performance
router.get('/institutes/:instituteId/performance', (req, res) => {
  return sendAdminSuccess(res, {
    instituteId: req.params.instituteId,
    attendanceRate: 92.4,
    completionRate: 85.1,
    assessmentPassRate: 81.3,
    certificateIssuanceRate: 94.0,
    placementRate: 46.8,
    activeBatches: 18,
    totalTraineesTrained: 840,
  });
});

// 36. GET /institutes/:instituteId/devices
router.get('/institutes/:instituteId/devices', async (req, res) => {
  try {
    const devices = await Device.find({ instituteId: req.params.instituteId }).lean();
    return sendAdminSuccess(res, devices);
  } catch (e) {
    return sendAdminError(res, 'DEVICES_ERROR', e.message);
  }
});

// 37. GET /institutes/:instituteId/programmes
router.get('/institutes/:instituteId/programmes', async (req, res) => {
  try {
    const progs = await Programme.find().limit(10).lean();
    return sendAdminSuccess(res, progs);
  } catch (e) {
    return sendAdminError(res, 'PROGS_ERROR', e.message);
  }
});

// 38. GET /institutes/:instituteId/learners
router.get('/institutes/:instituteId/learners', async (req, res) => {
  try {
    const learners = await User.find({ role: 'TRAINEE', instituteId: req.params.instituteId }).limit(20).lean();
    return sendAdminSuccess(res, learners);
  } catch (e) {
    return sendAdminError(res, 'LEARNERS_ERROR', e.message);
  }
});

// 39. GET /institutes/:instituteId/edge
router.get('/institutes/:instituteId/edge', async (req, res) => {
  try {
    const device = await Device.findOne({ instituteId: req.params.instituteId }).lean();
    return sendAdminSuccess(res, device || {
      nodeId: `STN-${req.params.instituteId}`,
      status: 'ONLINE',
      syncStatus: 'HEALTHY',
      lastHeartbeat: new Date(),
    });
  } catch (e) {
    return sendAdminError(res, 'EDGE_ERROR', e.message);
  }
});

// 40. GET /institutes/:instituteId/audit
router.get('/institutes/:instituteId/audit', async (req, res) => {
  try {
    const logs = await AuditLog.find({ instituteId: req.params.instituteId }).limit(20).lean();
    return sendAdminSuccess(res, logs);
  } catch (e) {
    return sendAdminError(res, 'AUDIT_ERROR', e.message);
  }
});

// 41. GET /edge/nodes
router.get('/edge/nodes', async (req, res) => {
  try {
    const nodes = await Device.find().lean();
    const result = paginateArray(nodes, req.query.page, req.query.limit);
    return sendAdminSuccess(res, result.data, result.pagination);
  } catch (e) {
    return sendAdminError(res, 'EDGE_NODES_ERROR', e.message);
  }
});

// 42. GET /edge/nodes/:nodeId
router.get('/edge/nodes/:nodeId', async (req, res) => {
  try {
    const node = await Device.findOne({ $or: [{ deviceId: req.params.nodeId }, { serialNumber: req.params.nodeId }] }).lean();
    return sendAdminSuccess(res, node || { nodeId: req.params.nodeId, status: 'ONLINE', storage: { usedPercent: 64 } });
  } catch (e) {
    return sendAdminError(res, 'NODE_ERROR', e.message);
  }
});

// 43. GET /edge/nodes/:nodeId/health
router.get('/edge/nodes/:nodeId/health', (req, res) => {
  return sendAdminSuccess(res, {
    nodeId: req.params.nodeId,
    status: 'ONLINE',
    cpuUsagePercent: 24,
    ramUsagePercent: 58,
    diskUsagePercent: 64,
    temperatureCelsius: 41,
    uptimeSeconds: 849200,
  });
});

// 44. GET /edge/nodes/:nodeId/heartbeat
router.get('/edge/nodes/:nodeId/heartbeat', (req, res) => {
  return sendAdminSuccess(res, {
    nodeId: req.params.nodeId,
    lastSeenAt: new Date(),
    latencyMs: 38,
    status: 'CONNECTED',
  });
});

// 45. GET /edge/nodes/:nodeId/sync
router.get('/edge/nodes/:nodeId/sync', (req, res) => {
  return sendAdminSuccess(res, {
    nodeId: req.params.nodeId,
    status: 'HEALTHY',
    pendingRecords: 0,
    failedRecords: 0,
    lastSuccessfulSyncAt: new Date(),
  });
});

// 46. GET /edge/nodes/:nodeId/logs
router.get('/edge/nodes/:nodeId/logs', (req, res) => {
  return sendAdminSuccess(res, {
    nodeId: req.params.nodeId,
    logs: [
      { timestamp: new Date(), level: 'INFO', message: 'Local biometric attendance package verified.' },
      { timestamp: new Date(Date.now() - 3600000), level: 'INFO', message: 'Delta sync completed with HQ Central.' },
    ]
  });
});

// 47. POST /edge/nodes/:nodeId/sync/retry
router.post('/edge/nodes/:nodeId/sync/retry', async (req, res) => {
  await recordAdminAudit({ action: 'EDGE_SYNC_RETRY_TRIGGERED', entityType: 'EDGE_NODE', entityId: req.params.nodeId, req });
  return sendAdminSuccess(res, { nodeId: req.params.nodeId, status: 'SYNC_TRIGGERED', initiatedAt: new Date() });
});

// 48. POST /edge/nodes/:nodeId/update
router.post('/edge/nodes/:nodeId/update', async (req, res) => {
  await recordAdminAudit({ action: 'EDGE_FIRMWARE_UPDATE_INITIATED', entityType: 'EDGE_NODE', entityId: req.params.nodeId, req });
  return sendAdminSuccess(res, { nodeId: req.params.nodeId, targetVersion: req.body.version || 'v2.4.1', status: 'DISPATCHED' });
});

// 49. GET /partners/pending
router.get('/partners/pending', adminController.getPendingPartners);

// 50. GET /partners/:partnerId
router.get('/partners/:partnerId', async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.partnerId }).lean();
    return sendAdminSuccess(res, user || { partnerId: req.params.partnerId, status: 'PENDING_APPROVAL' });
  } catch (e) {
    return sendAdminError(res, 'PARTNER_GET_ERROR', e.message);
  }
});

// 51. POST /partners/:partnerId/approve
router.post('/partners/:partnerId/approve', async (req, res) => {
  await User.updateOne({ userId: req.params.partnerId }, { $set: { status: 'ACTIVE' } });
  await recordAdminAudit({ action: 'PARTNER_APPROVED', entityType: 'PARTNER', entityId: req.params.partnerId, req, reason: req.body.remarks });
  return sendAdminSuccess(res, { partnerId: req.params.partnerId, status: 'APPROVED', approvedAt: new Date() });
});

// 52. POST /partners/:partnerId/reject
router.post('/partners/:partnerId/reject', async (req, res) => {
  await User.updateOne({ userId: req.params.partnerId }, { $set: { status: 'REJECTED' } });
  await recordAdminAudit({ action: 'PARTNER_REJECTED', entityType: 'PARTNER', entityId: req.params.partnerId, req, reason: req.body.remarks });
  return sendAdminSuccess(res, { partnerId: req.params.partnerId, status: 'REJECTED', rejectedAt: new Date() });
});

// 53. POST /partners/:partnerId/request-info
router.post('/partners/:partnerId/request-info', async (req, res) => {
  await recordAdminAudit({ action: 'PARTNER_INFO_REQUESTED', entityType: 'PARTNER', entityId: req.params.partnerId, req, reason: req.body.message });
  return sendAdminSuccess(res, { partnerId: req.params.partnerId, status: 'INFO_REQUESTED', sentAt: new Date() });
});

/* ══════════════════════════════════════════════════════════════════════════
   3. 👥 IDENTITY & ACCESS (29 Unique APIs)
   ══════════════════════════════════════════════════════════════════════════ */
// 54. GET /users
router.get('/users', adminController.getAllUsers);

// 55. GET /users/:userId
router.get('/users/:userId', adminController.getUserById);

// 56. POST /users
router.post('/users', async (req, res) => {
  try {
    const newUser = new User(req.body);
    await newUser.save();
    await recordAdminAudit({ action: 'USER_CREATED', entityType: 'USER', entityId: newUser.userId, req });
    return sendAdminSuccess(res, newUser, null, 201);
  } catch (e) {
    return sendAdminError(res, 'USER_CREATE_ERROR', e.message);
  }
});

// 57. PATCH /users/:userId
router.patch('/users/:userId', async (req, res) => {
  try {
    const updated = await User.findOneAndUpdate({ userId: req.params.userId }, { $set: req.body }, { new: true });
    await recordAdminAudit({ action: 'USER_UPDATED', entityType: 'USER', entityId: req.params.userId, req, newState: req.body });
    return sendAdminSuccess(res, updated);
  } catch (e) {
    return sendAdminError(res, 'USER_UPDATE_ERROR', e.message);
  }
});

// 58. PATCH /users/:userId/status
router.patch('/users/:userId/status', adminController.updateUserStatus);

// 59. POST /users/:userId/reset-password
router.post('/users/:userId/reset-password', adminController.resetUserPassword);

// 60. POST /users/:userId/revoke-sessions
router.post('/users/:userId/revoke-sessions', async (req, res) => {
  await User.updateOne({ userId: req.params.userId }, { $inc: { tokenVersion: 1 } });
  await recordAdminAudit({ action: 'USER_SESSIONS_REVOKED', entityType: 'USER', entityId: req.params.userId, req });
  return sendAdminSuccess(res, { userId: req.params.userId, revoked: true, revokedAt: new Date() });
});

// 61. GET /users/:userId/login-history
router.get('/users/:userId/login-history', (req, res) => {
  return sendAdminSuccess(res, {
    userId: req.params.userId,
    logins: [
      { timestamp: new Date(), ip: '10.0.4.12', client: 'Web Chrome 129', status: 'SUCCESS' },
      { timestamp: new Date(Date.now() - 86400000), ip: '10.0.4.12', client: 'Web Chrome 129', status: 'SUCCESS' },
    ]
  });
});

// 62. GET /users/:userId/audit
router.get('/users/:userId/audit', async (req, res) => {
  try {
    const logs = await AuditLog.find({ actorId: req.params.userId }).limit(20).lean();
    return sendAdminSuccess(res, logs);
  } catch (e) {
    return sendAdminError(res, 'USER_AUDIT_ERROR', e.message);
  }
});

// 63. DELETE /users/:userId
router.delete('/users/:userId', adminController.deleteUser);

// 64. GET /partners/verification
router.get('/partners/verification', adminController.getPendingPartners);

// 65. GET /partners/:partnerId/verification
router.get('/partners/:partnerId/verification', async (req, res) => {
  return sendAdminSuccess(res, {
    partnerId: req.params.partnerId,
    verification: { identity: 'VERIFIED', documents: 'VERIFIED', authorization: 'APPROVED' },
    status: 'VERIFIED'
  });
});

// 66. POST /partners/:partnerId/verification/approve
router.post('/partners/:partnerId/verification/approve', async (req, res) => {
  await User.updateOne({ userId: req.params.partnerId }, { $set: { status: 'ACTIVE' } });
  await recordAdminAudit({ action: 'PARTNER_VERIFIED_APPROVED', entityType: 'PARTNER', entityId: req.params.partnerId, req });
  return sendAdminSuccess(res, { partnerId: req.params.partnerId, status: 'APPROVED' });
});

// 67. POST /partners/:partnerId/verification/reject
router.post('/partners/:partnerId/verification/reject', async (req, res) => {
  await User.updateOne({ userId: req.params.partnerId }, { $set: { status: 'REJECTED' } });
  await recordAdminAudit({ action: 'PARTNER_VERIFIED_REJECTED', entityType: 'PARTNER', entityId: req.params.partnerId, req });
  return sendAdminSuccess(res, { partnerId: req.params.partnerId, status: 'REJECTED' });
});

// 68. PATCH /partners/:partnerId/approval (Onmint Legacy)
router.patch('/partners/:partnerId/approval', adminController.patchPartnerApproval);

// 69. GET /roles
router.get('/roles', (req, res) => {
  const roles = [
    { roleId: 'ROLE-001', code: 'SUPER_ADMIN', name: 'Super Admin', application: 'NCCT_HQ', permissions: ['*'], status: 'ACTIVE' },
    { roleId: 'ROLE-002', code: 'INSTITUTE_DIRECTOR', name: 'Institute Director', application: 'INSTITUTE_PARTNER', permissions: ['INSTITUTE_MANAGE', 'PROGRAMME_APPROVE'], status: 'ACTIVE' },
    { roleId: 'ROLE-003', code: 'TRAINER_FACULTY', name: 'Trainer / Faculty', application: 'INSTITUTE_PARTNER', permissions: ['ATTENDANCE_TAKE', 'COURSE_DELIVER'], status: 'ACTIVE' },
    { roleId: 'ROLE-004', code: 'TRAINEE', name: 'Trainee / Learner', application: 'LEARNER', permissions: ['COURSE_VIEW', 'CERTIFICATE_VIEW'], status: 'ACTIVE' },
  ];
  const result = paginateArray(roles, req.query.page, req.query.limit);
  return sendAdminSuccess(res, result.data, result.pagination);
});

// 70. GET /roles/:roleId
router.get('/roles/:roleId', (req, res) => {
  return sendAdminSuccess(res, { roleId: req.params.roleId, code: 'SUPER_ADMIN', name: 'Super Admin', permissions: ['*'] });
});

// 71. POST /roles
router.post('/roles', async (req, res) => {
  await recordAdminAudit({ action: 'ROLE_CREATED', entityType: 'ROLE', entityId: req.body.code, req });
  return sendAdminSuccess(res, { roleId: `ROLE-${Date.now().toString().slice(-4)}`, ...req.body }, null, 201);
});

// 72. PATCH /roles/:roleId
router.patch('/roles/:roleId', async (req, res) => {
  await recordAdminAudit({ action: 'ROLE_UPDATED', entityType: 'ROLE', entityId: req.params.roleId, req, newState: req.body });
  return sendAdminSuccess(res, { roleId: req.params.roleId, ...req.body });
});

// 73. DELETE /roles/:roleId
router.delete('/roles/:roleId', async (req, res) => {
  await recordAdminAudit({ action: 'ROLE_DELETED', entityType: 'ROLE', entityId: req.params.roleId, req });
  return sendAdminSuccess(res, { roleId: req.params.roleId, deleted: true });
});

// 74. GET /permissions
router.get('/permissions', (req, res) => {
  const perms = [
    { permissionId: 'PERM-001', code: 'USER_MANAGE', module: 'IDENTITY', action: 'MANAGE', description: 'Create and update users' },
    { permissionId: 'PERM-002', code: 'PROGRAMME_APPROVE', module: 'PROGRAMMES', action: 'APPROVE', description: 'Approve programmes' },
    { permissionId: 'PERM-003', code: 'CERTIFICATE_ISSUE', module: 'CERTIFICATES', action: 'ISSUE', description: 'Issue credentials' },
  ];
  const result = paginateArray(perms, req.query.page, req.query.limit);
  return sendAdminSuccess(res, result.data, result.pagination);
});

// 75. GET /permissions/:permissionId
router.get('/permissions/:permissionId', (req, res) => {
  return sendAdminSuccess(res, { permissionId: req.params.permissionId, code: 'USER_MANAGE', module: 'IDENTITY' });
});

// 76. GET /role-assignments
router.get('/role-assignments', async (req, res) => {
  try {
    const users = await User.find({ 'roleAssignments.0': { $exists: true } }).select('userId name roleAssignments').limit(20).lean();
    const assignments = users.flatMap(u => (u.roleAssignments || []).map(r => ({ ...r, userId: u.userId, userName: u.name })));
    const result = paginateArray(assignments.length ? assignments : [
      { id: 'ASGN-01', userId: 'USR-00001', role: 'SUPER_ADMIN', application: 'NCCT_HQ', status: 'ACTIVE' },
    ], req.query.page, req.query.limit);
    return sendAdminSuccess(res, result.data, result.pagination);
  } catch (e) {
    return sendAdminError(res, 'ROLE_ASSIGN_ERROR', e.message);
  }
});

// 77. GET /role-assignments/:id
router.get('/role-assignments/:id', (req, res) => {
  return sendAdminSuccess(res, { id: req.params.id, role: 'SUPER_ADMIN', status: 'ACTIVE' });
});

// 78. POST /role-assignments
router.post('/role-assignments', async (req, res) => {
  await recordAdminAudit({ action: 'ROLE_ASSIGNED', entityType: 'ROLE_ASSIGNMENT', entityId: req.body.userId, req, newState: req.body });
  return sendAdminSuccess(res, { id: `ASGN-${Date.now().toString().slice(-4)}`, ...req.body }, null, 201);
});

// 79. PATCH /role-assignments/:id
router.patch('/role-assignments/:id', async (req, res) => {
  await recordAdminAudit({ action: 'ROLE_ASSIGNMENT_UPDATED', entityType: 'ROLE_ASSIGNMENT', entityId: req.params.id, req, newState: req.body });
  return sendAdminSuccess(res, { id: req.params.id, ...req.body });
});

// 80. PATCH /role-assignments/:id/revoke
router.patch('/role-assignments/:id/revoke', async (req, res) => {
  await recordAdminAudit({ action: 'ROLE_ASSIGNMENT_REVOKED', entityType: 'ROLE_ASSIGNMENT', entityId: req.params.id, req });
  return sendAdminSuccess(res, { id: req.params.id, status: 'REVOKED', revokedAt: new Date() });
});

// 81. GET /users/:userId/effective-access
router.get('/users/:userId/effective-access', (req, res) => {
  return sendAdminSuccess(res, {
    userId: req.params.userId,
    effectivePermissions: ['*'],
    scope: { institutes: ['ALL'], programmes: ['ALL'], organization: 'NCCT_HQ' }
  });
});

// 82. GET /users/:userId/access-scope
router.get('/users/:userId/access-scope', (req, res) => {
  return sendAdminSuccess(res, {
    userId: req.params.userId,
    application: 'NCCT_HQ',
    allowedInstitutes: ['ALL'],
    allowedProgrammes: ['ALL'],
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   4. 📅 PROGRAMMES & CALENDAR (20 Unique APIs)
   ══════════════════════════════════════════════════════════════════════════ */
// 83. GET /programmes
router.get('/programmes', async (req, res) => {
  try {
    const progs = await Programme.find().lean();
    const result = paginateArray(progs, req.query.page, req.query.limit);
    return sendAdminSuccess(res, result.data, result.pagination);
  } catch (e) {
    return sendAdminError(res, 'PROGRAMMES_ERROR', e.message);
  }
});

// 84. GET /programmes/:programmeId
router.get('/programmes/:programmeId', async (req, res) => {
  try {
    const prog = await Programme.findOne({ programmeId: req.params.programmeId }).lean();
    if (!prog) return sendAdminError(res, 'NOT_FOUND', 'Programme not found', 404);
    return sendAdminSuccess(res, prog);
  } catch (e) {
    return sendAdminError(res, 'PROGRAMME_ERROR', e.message);
  }
});

// 85. POST /programmes
router.post('/programmes', async (req, res) => {
  try {
    const prog = new Programme(req.body);
    await prog.save();
    await recordAdminAudit({ action: 'PROGRAMME_CREATED', entityType: 'PROGRAMME', entityId: prog.programmeId, req });
    return sendAdminSuccess(res, prog, null, 201);
  } catch (e) {
    return sendAdminError(res, 'PROGRAMME_CREATE_ERROR', e.message);
  }
});

// 86. PATCH /programmes/:programmeId
router.patch('/programmes/:programmeId', async (req, res) => {
  try {
    const updated = await Programme.findOneAndUpdate({ programmeId: req.params.programmeId }, { $set: req.body }, { new: true });
    await recordAdminAudit({ action: 'PROGRAMME_UPDATED', entityType: 'PROGRAMME', entityId: req.params.programmeId, req, newState: req.body });
    return sendAdminSuccess(res, updated);
  } catch (e) {
    return sendAdminError(res, 'PROGRAMME_UPDATE_ERROR', e.message);
  }
});

// 87. POST /programmes/:programmeId/submit
router.post('/programmes/:programmeId/submit', async (req, res) => {
  await Programme.updateOne({ programmeId: req.params.programmeId }, { $set: { status: 'PENDING_APPROVAL' } });
  await recordAdminAudit({ action: 'PROGRAMME_SUBMITTED', entityType: 'PROGRAMME', entityId: req.params.programmeId, req });
  return sendAdminSuccess(res, { programmeId: req.params.programmeId, status: 'PENDING_APPROVAL' });
});

// 88. POST /programmes/:programmeId/archive
router.post('/programmes/:programmeId/archive', async (req, res) => {
  await Programme.updateOne({ programmeId: req.params.programmeId }, { $set: { status: 'ARCHIVED' } });
  await recordAdminAudit({ action: 'PROGRAMME_ARCHIVED', entityType: 'PROGRAMME', entityId: req.params.programmeId, req });
  return sendAdminSuccess(res, { programmeId: req.params.programmeId, status: 'ARCHIVED' });
});

// 89. GET /programmes/catalogue
router.get('/programmes/catalogue', async (req, res) => {
  try {
    const progs = await Programme.find({ status: { $ne: 'ARCHIVED' } }).lean();
    const result = paginateArray(progs, req.query.page, req.query.limit);
    return sendAdminSuccess(res, result.data, result.pagination);
  } catch (e) {
    return sendAdminError(res, 'CATALOGUE_ERROR', e.message);
  }
});

// 90. GET /programmes/catalogue/:programmeId
router.get('/programmes/catalogue/:programmeId', async (req, res) => {
  try {
    const prog = await Programme.findOne({ programmeId: req.params.programmeId }).lean();
    return sendAdminSuccess(res, prog);
  } catch (e) {
    return sendAdminError(res, 'CATALOGUE_ITEM_ERROR', e.message);
  }
});

// 91. GET /calendar
router.get('/calendar', (req, res) => {
  return sendAdminSuccess(res, {
    year: Number(req.query.year) || 2026,
    totalEvents: 42,
    activeQ: 'Q3',
  });
});

// 92. GET /calendar/events
router.get('/calendar/events', (req, res) => {
  const events = [
    { eventId: 'EVT-01', title: 'National Cooperative Conference 2026', startDate: '2026-10-15', endDate: '2026-10-18', instituteId: 'INST-VAMNICOM' },
    { eventId: 'EVT-02', title: 'PACS Cyber Security Workshop', startDate: '2026-10-22', endDate: '2026-10-24', instituteId: 'INST-RICM-BLR' },
  ];
  const result = paginateArray(events, req.query.page, req.query.limit);
  return sendAdminSuccess(res, result.data, result.pagination);
});

// 93. POST /calendar/events
router.post('/calendar/events', async (req, res) => {
  await recordAdminAudit({ action: 'CALENDAR_EVENT_CREATED', entityType: 'CALENDAR_EVENT', entityId: req.body.eventId || 'EVT-NEW', req });
  return sendAdminSuccess(res, { eventId: req.body.eventId || 'EVT-NEW', ...req.body, createdAt: new Date() }, null, 201);
});

// 94. PATCH /calendar/events/:eventId
router.patch('/calendar/events/:eventId', async (req, res) => {
  await recordAdminAudit({ action: 'CALENDAR_EVENT_UPDATED', entityType: 'CALENDAR_EVENT', entityId: req.params.eventId, req, newState: req.body });
  return sendAdminSuccess(res, { eventId: req.params.eventId, ...req.body });
});

// 95. DELETE /calendar/events/:eventId
router.delete('/calendar/events/:eventId', async (req, res) => {
  await recordAdminAudit({ action: 'CALENDAR_EVENT_DELETED', entityType: 'CALENDAR_EVENT', entityId: req.params.eventId, req });
  return sendAdminSuccess(res, { eventId: req.params.eventId, deleted: true });
});

// 96. GET /programmes/:programmeId/versions
router.get('/programmes/:programmeId/versions', (req, res) => {
  return sendAdminSuccess(res, {
    programmeId: req.params.programmeId,
    versions: [
      { version: 1, approvedAt: '2025-10-12', approvedBy: 'PAC' },
      { version: 2, approvedAt: '2026-04-01', approvedBy: 'PAC' },
    ]
  });
});

// 97. GET /programmes/:programmeId/versions/:version
router.get('/programmes/:programmeId/versions/:version', (req, res) => {
  return sendAdminSuccess(res, {
    programmeId: req.params.programmeId,
    version: Number(req.params.version),
    curriculumUnits: 8,
    credits: 4,
  });
});

// 98. GET /programmes/:programmeId/versions/compare
router.get('/programmes/:programmeId/versions/compare', (req, res) => {
  return sendAdminSuccess(res, {
    programmeId: req.params.programmeId,
    diff: {
      addedTopics: ['AI in Cooperative Auditing', 'Unified Portal Integration'],
      removedTopics: ['Manual Ledger Balancing'],
    }
  });
});

// 99. POST /programmes/:programmeId/versions
router.post('/programmes/:programmeId/versions', async (req, res) => {
  await recordAdminAudit({ action: 'PROGRAMME_VERSION_BUMPED', entityType: 'PROGRAMME', entityId: req.params.programmeId, req });
  return sendAdminSuccess(res, { programmeId: req.params.programmeId, newVersion: 3, status: 'DRAFT' }, null, 201);
});

// 100. GET /programme-approvals
router.get('/programme-approvals', async (req, res) => {
  try {
    const list = await Programme.find({ status: { $in: ['PENDING_APPROVAL', 'UNDER_REVIEW'] } }).lean();
    const result = paginateArray(list, req.query.page, req.query.limit);
    return sendAdminSuccess(res, result.data, result.pagination);
  } catch (e) {
    return sendAdminError(res, 'APPROVALS_ERROR', e.message);
  }
});

// 101. POST /programmes/:programmeId/approve
router.post('/programmes/:programmeId/approve', async (req, res) => {
  await Programme.updateOne({ programmeId: req.params.programmeId }, { $set: { status: 'APPROVED' } });
  await recordAdminAudit({ action: 'PROGRAMME_APPROVED', entityType: 'PROGRAMME', entityId: req.params.programmeId, req, reason: req.body.remarks });
  return sendAdminSuccess(res, { programmeId: req.params.programmeId, status: 'APPROVED' });
});

// 102. POST /programmes/:programmeId/reject
router.post('/programmes/:programmeId/reject', async (req, res) => {
  await Programme.updateOne({ programmeId: req.params.programmeId }, { $set: { status: 'REJECTED' } });
  await recordAdminAudit({ action: 'PROGRAMME_REJECTED', entityType: 'PROGRAMME', entityId: req.params.programmeId, req, reason: req.body.remarks });
  return sendAdminSuccess(res, { programmeId: req.params.programmeId, status: 'REJECTED' });
});

/* ══════════════════════════════════════════════════════════════════════════
   5. 📝 TRAINING & ENROLMENT (22 Unique APIs)
   ══════════════════════════════════════════════════════════════════════════ */
// 103. POST /programmes/:programmeId/request-changes
router.post('/programmes/:programmeId/request-changes', async (req, res) => {
  await Programme.updateOne({ programmeId: req.params.programmeId }, { $set: { status: 'CHANGES_REQUESTED' } });
  await recordAdminAudit({ action: 'PROGRAMME_CHANGES_REQUESTED', entityType: 'PROGRAMME', entityId: req.params.programmeId, req, reason: req.body.reason });
  return sendAdminSuccess(res, { programmeId: req.params.programmeId, status: 'CHANGES_REQUESTED' });
});

// 104. GET /registrations
router.get('/registrations', async (req, res) => {
  try {
    const list = await Enrollment.find().lean();
    const result = paginateArray(list, req.query.page, req.query.limit);
    return sendAdminSuccess(res, result.data, result.pagination);
  } catch (e) {
    return sendAdminError(res, 'REGISTRATIONS_ERROR', e.message);
  }
});

// 105. GET /registrations/:id
router.get('/registrations/:id', async (req, res) => {
  try {
    const reg = await Enrollment.findOne({ $or: [{ enrollmentId: req.params.id }, { _id: req.params.id }] }).lean();
    return sendAdminSuccess(res, reg || { registrationId: req.params.id, status: 'ENROLLED' });
  } catch (e) {
    return sendAdminError(res, 'REG_ERROR', e.message);
  }
});

// 106. PATCH /registrations/:id/status
router.patch('/registrations/:id/status', async (req, res) => {
  await recordAdminAudit({ action: 'REGISTRATION_STATUS_CHANGED', entityType: 'REGISTRATION', entityId: req.params.id, req, newState: { status: req.body.status } });
  return sendAdminSuccess(res, { registrationId: req.params.id, status: req.body.status || 'ACTIVE' });
});

// 107. GET /nominations
router.get('/nominations', (req, res) => {
  const noms = [
    { nominationId: 'NOM-01', nominatingOrg: 'IFFCO Kisan', traineeName: 'Sanjay Deshmukh', programmeName: 'Advanced PACS Management', status: 'PENDING' },
    { nominationId: 'NOM-02', nominatingOrg: 'KRIBHCO', traineeName: 'Rajesh Meena', programmeName: 'Cooperative Banking Compliance', status: 'APPROVED' },
  ];
  const result = paginateArray(noms, req.query.page, req.query.limit);
  return sendAdminSuccess(res, result.data, result.pagination);
});

// 108. GET /nominations/:id
router.get('/nominations/:id', (req, res) => {
  return sendAdminSuccess(res, { nominationId: req.params.id, status: 'PENDING' });
});

// 109. POST /nominations/:id/approve
router.post('/nominations/:id/approve', async (req, res) => {
  await recordAdminAudit({ action: 'NOMINATION_APPROVED', entityType: 'NOMINATION', entityId: req.params.id, req });
  return sendAdminSuccess(res, { nominationId: req.params.id, status: 'APPROVED' });
});

// 110. POST /nominations/:id/reject
router.post('/nominations/:id/reject', async (req, res) => {
  await recordAdminAudit({ action: 'NOMINATION_REJECTED', entityType: 'NOMINATION', entityId: req.params.id, req });
  return sendAdminSuccess(res, { nominationId: req.params.id, status: 'REJECTED' });
});

// 111. GET /applications
router.get('/applications', (req, res) => {
  const apps = [
    { applicationId: 'APP-01', applicantName: 'Kavita Rao', programmeId: 'PRG-001', submittedAt: new Date(), status: 'PENDING' },
  ];
  const result = paginateArray(apps, req.query.page, req.query.limit);
  return sendAdminSuccess(res, result.data, result.pagination);
});

// 112. GET /applications/:id
router.get('/applications/:id', (req, res) => {
  return sendAdminSuccess(res, { applicationId: req.params.id, status: 'VERIFIED' });
});

// 113. PATCH /applications/:id/status
router.patch('/applications/:id/status', async (req, res) => {
  await recordAdminAudit({ action: 'APPLICATION_STATUS_UPDATED', entityType: 'APPLICATION', entityId: req.params.id, req, newState: { status: req.body.status } });
  return sendAdminSuccess(res, { applicationId: req.params.id, status: req.body.status });
});

// 114. GET /eligibility/rules
router.get('/eligibility/rules', (req, res) => {
  return sendAdminSuccess(res, {
    rules: [
      { ruleId: 'RUL-01', name: 'PACS Graduation Minimum', minEducation: 'Graduation', maxAge: 45 },
      { ruleId: 'RUL-02', name: 'Board Member Nomination', minYearsExperience: 2 },
    ]
  });
});

// 115. POST /eligibility/rules
router.post('/eligibility/rules', async (req, res) => {
  await recordAdminAudit({ action: 'ELIGIBILITY_RULE_CREATED', entityType: 'ELIGIBILITY_RULE', entityId: req.body.ruleId || 'RUL-NEW', req });
  return sendAdminSuccess(res, { ruleId: req.body.ruleId || 'RUL-NEW', ...req.body }, null, 201);
});

// 116. PATCH /eligibility/rules/:id
router.patch('/eligibility/rules/:id', async (req, res) => {
  await recordAdminAudit({ action: 'ELIGIBILITY_RULE_UPDATED', entityType: 'ELIGIBILITY_RULE', entityId: req.params.id, req, newState: req.body });
  return sendAdminSuccess(res, { ruleId: req.params.id, ...req.body });
});

// 117. POST /eligibility/evaluate
router.post('/eligibility/evaluate', (req, res) => {
  return sendAdminSuccess(res, {
    applicantId: req.body.applicantId || 'APL-01',
    isEligible: true,
    score: 88,
    passedCriteria: ['Minimum Graduation Verified', 'No Active Disciplinary Sanction'],
  });
});

// 118. GET /batches
router.get('/batches', async (req, res) => {
  try {
    const list = await Batch.find().lean();
    const result = paginateArray(list, req.query.page, req.query.limit);
    return sendAdminSuccess(res, result.data, result.pagination);
  } catch (e) {
    return sendAdminError(res, 'BATCHES_ERROR', e.message);
  }
});

// 119. GET /batches/:batchId
router.get('/batches/:batchId', async (req, res) => {
  try {
    const batch = await Batch.findOne({ batchId: req.params.batchId }).lean();
    return sendAdminSuccess(res, batch || { batchId: req.params.batchId, status: 'RUNNING' });
  } catch (e) {
    return sendAdminError(res, 'BATCH_ERROR', e.message);
  }
});

// 120. POST /batches
router.post('/batches', async (req, res) => {
  try {
    const b = new Batch(req.body);
    await b.save();
    await recordAdminAudit({ action: 'BATCH_CREATED', entityType: 'BATCH', entityId: b.batchId, req });
    return sendAdminSuccess(res, b, null, 201);
  } catch (e) {
    return sendAdminError(res, 'BATCH_CREATE_ERROR', e.message);
  }
});

// 121. PATCH /batches/:batchId
router.patch('/batches/:batchId', async (req, res) => {
  try {
    const updated = await Batch.findOneAndUpdate({ batchId: req.params.batchId }, { $set: req.body }, { new: true });
    await recordAdminAudit({ action: 'BATCH_UPDATED', entityType: 'BATCH', entityId: req.params.batchId, req, newState: req.body });
    return sendAdminSuccess(res, updated);
  } catch (e) {
    return sendAdminError(res, 'BATCH_UPDATE_ERROR', e.message);
  }
});

// 122. PATCH /batches/:batchId/status
router.patch('/batches/:batchId/status', async (req, res) => {
  try {
    const updated = await Batch.findOneAndUpdate({ batchId: req.params.batchId }, { $set: { status: req.body.status } }, { new: true });
    await recordAdminAudit({ action: 'BATCH_STATUS_CHANGED', entityType: 'BATCH', entityId: req.params.batchId, req, newState: { status: req.body.status } });
    return sendAdminSuccess(res, updated);
  } catch (e) {
    return sendAdminError(res, 'BATCH_STATUS_ERROR', e.message);
  }
});

// 123. GET /batches/:batchId/seats
router.get('/batches/:batchId/seats', (req, res) => {
  return sendAdminSuccess(res, {
    batchId: req.params.batchId,
    totalCapacity: 40,
    occupiedSeats: 34,
    availableSeats: 6,
  });
});

// 124. PATCH /batches/:batchId/capacity
router.patch('/batches/:batchId/capacity', async (req, res) => {
  await Batch.updateOne({ batchId: req.params.batchId }, { $set: { capacity: req.body.capacity } });
  await recordAdminAudit({ action: 'BATCH_CAPACITY_UPDATED', entityType: 'BATCH', entityId: req.params.batchId, req, newState: { capacity: req.body.capacity } });
  return sendAdminSuccess(res, { batchId: req.params.batchId, capacity: req.body.capacity });
});

/* ══════════════════════════════════════════════════════════════════════════
   6. 🎓 TRAINEES (11 Unique APIs)
   ══════════════════════════════════════════════════════════════════════════ */
// 125. POST /batches/:batchId/assign-trainee
router.post('/batches/:batchId/assign-trainee', async (req, res) => {
  await recordAdminAudit({ action: 'TRAINEE_ASSIGNED_TO_BATCH', entityType: 'BATCH', entityId: req.params.batchId, req, newState: { traineeId: req.body.traineeId } });
  return sendAdminSuccess(res, { batchId: req.params.batchId, traineeId: req.body.traineeId, assignedAt: new Date() });
});

// 126. GET /trainees
router.get('/trainees', async (req, res) => {
  try {
    const list = await User.find({ role: 'TRAINEE' }).lean();
    const result = paginateArray(list, req.query.page, req.query.limit);
    return sendAdminSuccess(res, result.data, result.pagination);
  } catch (e) {
    return sendAdminError(res, 'TRAINEES_ERROR', e.message);
  }
});

// 127. GET /trainees/:traineeId
router.get('/trainees/:traineeId', async (req, res) => {
  try {
    const t = await User.findOne({ userId: req.params.traineeId }).lean();
    return sendAdminSuccess(res, t || { traineeId: req.params.traineeId, status: 'ACTIVE', attendanceRate: 91.4 });
  } catch (e) {
    return sendAdminError(res, 'TRAINEE_ERROR', e.message);
  }
});

// 128. GET /trainees/:traineeId/timeline
router.get('/trainees/:traineeId/timeline', (req, res) => {
  return sendAdminSuccess(res, {
    traineeId: req.params.traineeId,
    timeline: [
      { date: '2026-08-01', event: 'Registered for PRAGYAAN' },
      { date: '2026-08-05', event: 'Nomination Approved by Amul' },
      { date: '2026-08-10', event: 'Enrolled in Batch 04' },
      { date: '2026-09-15', event: 'Completed Digital Banking Assessment (Pass - 88%)' },
      { date: '2026-09-20', event: 'Tamper-Evident Certificate Issued' },
    ]
  });
});

// 129. GET /trainees/:traineeId/training
router.get('/trainees/:traineeId/training', (req, res) => {
  return sendAdminSuccess(res, {
    traineeId: req.params.traineeId,
    activeBatches: ['BAT-004'],
    completedProgrammes: ['PRG-001'],
  });
});

// 130. GET /trainees/:traineeId/learning
router.get('/trainees/:traineeId/learning', (req, res) => {
  return sendAdminSuccess(res, {
    traineeId: req.params.traineeId,
    overallProgress: 78,
    coursesEnrolled: 4,
    coursesCompleted: 3,
  });
});

// 131. GET /trainees/:traineeId/attendance
router.get('/trainees/:traineeId/attendance', (req, res) => {
  return sendAdminSuccess(res, {
    traineeId: req.params.traineeId,
    attendanceRate: 92.5,
    presentSessions: 37,
    totalSessions: 40,
  });
});

// 132. GET /trainees/:traineeId/assessments
router.get('/trainees/:traineeId/assessments', (req, res) => {
  return sendAdminSuccess(res, {
    traineeId: req.params.traineeId,
    attempts: [
      { assessmentName: 'PACS Accounting Mid-Term', score: 88, status: 'PASSED' },
      { assessmentName: 'Cooperative Banking Compliance Final', score: 92, status: 'PASSED' },
    ]
  });
});

// 133. GET /trainees/:traineeId/skills
router.get('/trainees/:traineeId/skills', (req, res) => {
  return sendAdminSuccess(res, {
    traineeId: req.params.traineeId,
    verifiedSkills: [
      { name: 'PACS Accounting', level: 3, verifiedBy: 'ICM Lucknow' },
      { name: 'Digital KYC Verification', level: 2, verifiedBy: 'VAMNICOM' },
    ]
  });
});

// 134. GET /trainees/:traineeId/certificates
router.get('/trainees/:traineeId/certificates', async (req, res) => {
  try {
    const certs = await Certificate.find({ traineeId: req.params.traineeId }).lean();
    return sendAdminSuccess(res, certs);
  } catch (e) {
    return sendAdminError(res, 'CERTS_ERROR', e.message);
  }
});

// 135. GET /trainees/:traineeId/career
router.get('/trainees/:traineeId/career', (req, res) => {
  return sendAdminSuccess(res, {
    traineeId: req.params.traineeId,
    careerReadyScore: 84,
    recommendedRoles: ['Digital Banking Officer', 'PACS Assistant Manager'],
  });
});

// 136. GET /trainees/:traineeId/documents
router.get('/trainees/:traineeId/documents', (req, res) => {
  return sendAdminSuccess(res, {
    traineeId: req.params.traineeId,
    documents: [
      { name: 'Aadhaar e-KYC Proof', status: 'VERIFIED' },
      { name: 'Graduation Degree', status: 'VERIFIED' },
    ]
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   7. 🧭 TRAINING OPERATIONS (24 Unique APIs)
   ══════════════════════════════════════════════════════════════════════════ */
// 137. GET /timetable
router.get('/timetable', async (req, res) => {
  try {
    const list = await SessionSchedule.find().lean();
    const result = paginateArray(list, req.query.page, req.query.limit);
    return sendAdminSuccess(res, result.data, result.pagination);
  } catch (e) {
    return sendAdminError(res, 'TIMETABLE_ERROR', e.message);
  }
});

// 138. POST /timetable
router.post('/timetable', async (req, res) => {
  try {
    const s = new SessionSchedule(req.body);
    await s.save();
    await recordAdminAudit({ action: 'TIMETABLE_SESSION_SCHEDULED', entityType: 'TIMETABLE', entityId: s.sessionId || 'SESS-01', req });
    return sendAdminSuccess(res, s, null, 201);
  } catch (e) {
    return sendAdminError(res, 'TIMETABLE_CREATE_ERROR', e.message);
  }
});

// 139. PATCH /timetable/:id
router.patch('/timetable/:id', async (req, res) => {
  await recordAdminAudit({ action: 'TIMETABLE_UPDATED', entityType: 'TIMETABLE', entityId: req.params.id, req, newState: req.body });
  return sendAdminSuccess(res, { id: req.params.id, ...req.body });
});

// 140. DELETE /timetable/:id
router.delete('/timetable/:id', async (req, res) => {
  await recordAdminAudit({ action: 'TIMETABLE_DELETED', entityType: 'TIMETABLE', entityId: req.params.id, req });
  return sendAdminSuccess(res, { id: req.params.id, deleted: true });
});

// 141. GET /timetable/conflicts
router.get('/timetable/conflicts', (req, res) => {
  return sendAdminSuccess(res, { conflicts: [] });
});

// 142. GET /classrooms
router.get('/classrooms', async (req, res) => {
  try {
    const list = await Classroom.find().lean();
    const result = paginateArray(list, req.query.page, req.query.limit);
    return sendAdminSuccess(res, result.data, result.pagination);
  } catch (e) {
    return sendAdminError(res, 'CLASSROOMS_ERROR', e.message);
  }
});

// 143. GET /classrooms/:id
router.get('/classrooms/:id', async (req, res) => {
  try {
    const c = await Classroom.findOne({ $or: [{ roomId: req.params.id }, { _id: req.params.id }] }).lean();
    return sendAdminSuccess(res, c || { roomId: req.params.id, capacity: 50 });
  } catch (e) {
    return sendAdminError(res, 'CLASSROOM_ERROR', e.message);
  }
});

// 144. POST /classrooms
router.post('/classrooms', async (req, res) => {
  try {
    const c = new Classroom(req.body);
    await c.save();
    await recordAdminAudit({ action: 'CLASSROOM_CREATED', entityType: 'CLASSROOM', entityId: c.roomId, req });
    return sendAdminSuccess(res, c, null, 201);
  } catch (e) {
    return sendAdminError(res, 'CLASSROOM_CREATE_ERROR', e.message);
  }
});

// 145. PATCH /classrooms/:id
router.patch('/classrooms/:id', async (req, res) => {
  await recordAdminAudit({ action: 'CLASSROOM_UPDATED', entityType: 'CLASSROOM', entityId: req.params.id, req, newState: req.body });
  return sendAdminSuccess(res, { roomId: req.params.id, ...req.body });
});

// 146. DELETE /classrooms/:id
router.delete('/classrooms/:id', async (req, res) => {
  await recordAdminAudit({ action: 'CLASSROOM_DELETED', entityType: 'CLASSROOM', entityId: req.params.id, req });
  return sendAdminSuccess(res, { roomId: req.params.id, deleted: true });
});

// 147. GET /hostels
router.get('/hostels', async (req, res) => {
  try {
    const list = await HostelBlock.find().lean();
    const result = paginateArray(list, req.query.page, req.query.limit);
    return sendAdminSuccess(res, result.data, result.pagination);
  } catch (e) {
    return sendAdminError(res, 'HOSTELS_ERROR', e.message);
  }
});

// 148. GET /hostels/:id
router.get('/hostels/:id', async (req, res) => {
  try {
    const h = await HostelBlock.findOne({ $or: [{ blockId: req.params.id }, { _id: req.params.id }] }).lean();
    return sendAdminSuccess(res, h || { blockId: req.params.id, totalBeds: 120 });
  } catch (e) {
    return sendAdminError(res, 'HOSTEL_ERROR', e.message);
  }
});

// 149. GET /hostels/:id/occupancy
router.get('/hostels/:id/occupancy', (req, res) => {
  return sendAdminSuccess(res, { blockId: req.params.id, totalBeds: 120, occupiedBeds: 94, vacantBeds: 26 });
});

// 150. POST /hostels/:id/allocation
router.post('/hostels/:id/allocation', async (req, res) => {
  await recordAdminAudit({ action: 'HOSTEL_BED_ALLOCATED', entityType: 'HOSTEL', entityId: req.params.id, req, newState: req.body });
  return sendAdminSuccess(res, { blockId: req.params.id, ...req.body, status: 'ALLOCATED' }, null, 201);
});

// 151. POST /hostels/:id/check-in
router.post('/hostels/:id/check-in', async (req, res) => {
  await recordAdminAudit({ action: 'HOSTEL_CHECK_IN', entityType: 'HOSTEL', entityId: req.params.id, req });
  return sendAdminSuccess(res, { blockId: req.params.id, status: 'CHECKED_IN', checkedInAt: new Date() });
});

// 152. POST /hostels/:id/check-out
router.post('/hostels/:id/check-out', async (req, res) => {
  await recordAdminAudit({ action: 'HOSTEL_CHECK_OUT', entityType: 'HOSTEL', entityId: req.params.id, req });
  return sendAdminSuccess(res, { blockId: req.params.id, status: 'CHECKED_OUT', checkedOutAt: new Date() });
});

// 153. GET /logistics
router.get('/logistics', (req, res) => {
  const tasks = [
    { taskId: 'LOG-01', item: 'Course Kits (English/Hindi)', quantity: 350, status: 'DISPATCHED', instituteId: 'INST-VAMNICOM' },
    { taskId: 'LOG-02', item: 'Smart Attendance Tablets', quantity: 20, status: 'DELIVERED', instituteId: 'INST-RICM-JAIPUR' },
  ];
  const result = paginateArray(tasks, req.query.page, req.query.limit);
  return sendAdminSuccess(res, result.data, result.pagination);
});

// 154. GET /logistics/:id
router.get('/logistics/:id', (req, res) => {
  return sendAdminSuccess(res, { taskId: req.params.id, status: 'DISPATCHED' });
});

// 155. POST /logistics
router.post('/logistics', async (req, res) => {
  await recordAdminAudit({ action: 'LOGISTICS_TASK_CREATED', entityType: 'LOGISTICS', entityId: req.body.taskId || 'LOG-NEW', req });
  return sendAdminSuccess(res, { taskId: req.body.taskId || 'LOG-NEW', ...req.body }, null, 201);
});

// 156. PATCH /logistics/:id/status
router.patch('/logistics/:id/status', async (req, res) => {
  await recordAdminAudit({ action: 'LOGISTICS_STATUS_UPDATED', entityType: 'LOGISTICS', entityId: req.params.id, req, newState: { status: req.body.status } });
  return sendAdminSuccess(res, { taskId: req.params.id, status: req.body.status });
});

// 157. GET /trainers
router.get('/trainers', async (req, res) => {
  try {
    const list = await User.find({ role: { $in: ['TRAINER_FACULTY', 'FACULTY_TRAINER'] } }).lean();
    const result = paginateArray(list, req.query.page, req.query.limit);
    return sendAdminSuccess(res, result.data, result.pagination);
  } catch (e) {
    return sendAdminError(res, 'TRAINERS_ERROR', e.message);
  }
});

// 158. GET /trainers/:id
router.get('/trainers/:id', async (req, res) => {
  try {
    const t = await User.findOne({ userId: req.params.id }).lean();
    return sendAdminSuccess(res, t || { trainerId: req.params.id, rating: 4.8 });
  } catch (e) {
    return sendAdminError(res, 'TRAINER_ERROR', e.message);
  }
});

// 159. GET /trainers/:id/workload
router.get('/trainers/:id/workload', (req, res) => {
  return sendAdminSuccess(res, { trainerId: req.params.id, weeklyTeachingHours: 18, assignedBatches: 2 });
});

// 160. GET /trainers/:id/schedule
router.get('/trainers/:id/schedule', (req, res) => {
  return sendAdminSuccess(res, {
    trainerId: req.params.id,
    sessions: [
      { day: 'Monday', time: '10:00 - 12:00', topic: 'Cooperative Banking Fundamentals' },
    ]
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   8. 📖 LMS & LEARNING (27 Unique APIs)
   ══════════════════════════════════════════════════════════════════════════ */
// 161. GET /resource-persons
router.get('/resource-persons', async (req, res) => {
  try {
    const list = await User.find({ role: 'RESOURCE_PERSON' }).lean();
    const result = paginateArray(list, req.query.page, req.query.limit);
    return sendAdminSuccess(res, result.data, result.pagination);
  } catch (e) {
    return sendAdminError(res, 'RESOURCE_PERSONS_ERROR', e.message);
  }
});

// 162. GET /resource-persons/:id
router.get('/resource-persons/:id', async (req, res) => {
  try {
    const rp = await User.findOne({ userId: req.params.id }).lean();
    return sendAdminSuccess(res, rp || { resourcePersonId: req.params.id, expertise: 'Agrifinance' });
  } catch (e) {
    return sendAdminError(res, 'RP_ERROR', e.message);
  }
});

// 163. POST /resource-persons
router.post('/resource-persons', async (req, res) => {
  await recordAdminAudit({ action: 'RESOURCE_PERSON_ENROLLED', entityType: 'USER', entityId: req.body.userId || 'RP-01', req });
  return sendAdminSuccess(res, { userId: req.body.userId || 'RP-01', ...req.body }, null, 201);
});

// 164. PATCH /resource-persons/:id
router.patch('/resource-persons/:id', async (req, res) => {
  await recordAdminAudit({ action: 'RESOURCE_PERSON_UPDATED', entityType: 'USER', entityId: req.params.id, req, newState: req.body });
  return sendAdminSuccess(res, { userId: req.params.id, ...req.body });
});

// 165. GET /courses
router.get('/courses', async (req, res) => {
  try {
    const list = await Course.find().lean();
    const result = paginateArray(list, req.query.page, req.query.limit);
    return sendAdminSuccess(res, result.data, result.pagination);
  } catch (e) {
    return sendAdminError(res, 'COURSES_ERROR', e.message);
  }
});

// 166. GET /courses/:courseId
router.get('/courses/:courseId', async (req, res) => {
  try {
    const c = await Course.findOne({ courseId: req.params.courseId }).lean();
    return sendAdminSuccess(res, c || { courseId: req.params.courseId, title: 'PACS Accounting' });
  } catch (e) {
    return sendAdminError(res, 'COURSE_ERROR', e.message);
  }
});

// 167. POST /courses
router.post('/courses', async (req, res) => {
  try {
    const c = new Course(req.body);
    await c.save();
    await recordAdminAudit({ action: 'COURSE_CREATED', entityType: 'COURSE', entityId: c.courseId, req });
    return sendAdminSuccess(res, c, null, 201);
  } catch (e) {
    return sendAdminError(res, 'COURSE_CREATE_ERROR', e.message);
  }
});

// 168. PATCH /courses/:courseId
router.patch('/courses/:courseId', async (req, res) => {
  try {
    const updated = await Course.findOneAndUpdate({ courseId: req.params.courseId }, { $set: req.body }, { new: true });
    await recordAdminAudit({ action: 'COURSE_UPDATED', entityType: 'COURSE', entityId: req.params.courseId, req, newState: req.body });
    return sendAdminSuccess(res, updated);
  } catch (e) {
    return sendAdminError(res, 'COURSE_UPDATE_ERROR', e.message);
  }
});

// 169. GET /courses/:courseId/modules
router.get('/courses/:courseId/modules', (req, res) => {
  return sendAdminSuccess(res, {
    courseId: req.params.courseId,
    modules: [
      { moduleId: 'MOD-01', title: 'Introduction to Cooperative Law', order: 1 },
      { moduleId: 'MOD-02', title: 'Financial Auditing Principles', order: 2 },
    ]
  });
});

// 170. POST /courses/:courseId/modules
router.post('/courses/:courseId/modules', async (req, res) => {
  await recordAdminAudit({ action: 'COURSE_MODULE_CREATED', entityType: 'COURSE_MODULE', entityId: req.body.moduleId || 'MOD-NEW', req });
  return sendAdminSuccess(res, { courseId: req.params.courseId, ...req.body }, null, 201);
});

// 171. PATCH /modules/:moduleId
router.patch('/modules/:moduleId', async (req, res) => {
  await recordAdminAudit({ action: 'MODULE_UPDATED', entityType: 'COURSE_MODULE', entityId: req.params.moduleId, req, newState: req.body });
  return sendAdminSuccess(res, { moduleId: req.params.moduleId, ...req.body });
});

// 172. DELETE /modules/:moduleId
router.delete('/modules/:moduleId', async (req, res) => {
  await recordAdminAudit({ action: 'MODULE_DELETED', entityType: 'COURSE_MODULE', entityId: req.params.moduleId, req });
  return sendAdminSuccess(res, { moduleId: req.params.moduleId, deleted: true });
});

// 173. GET /content
router.get('/content', (req, res) => {
  const contents = [
    { contentId: 'CNT-001', title: 'Digital Banking Basics', type: 'VIDEO', courseId: 'CRS-001', language: 'en', status: 'PUBLISHED' },
    { contentId: 'CNT-002', title: 'PACS Balance Sheet Preparation', type: 'PDF', courseId: 'CRS-002', language: 'hi', status: 'PUBLISHED' },
  ];
  const result = paginateArray(contents, req.query.page, req.query.limit);
  return sendAdminSuccess(res, result.data, result.pagination);
});

// 174. GET /content/:contentId
router.get('/content/:contentId', (req, res) => {
  return sendAdminSuccess(res, { contentId: req.params.contentId, title: 'Digital Banking Basics', type: 'VIDEO', status: 'PUBLISHED' });
});

// 175. POST /content
router.post('/content', async (req, res) => {
  await recordAdminAudit({ action: 'CONTENT_CREATED', entityType: 'CONTENT', entityId: req.body.contentId || 'CNT-NEW', req });
  return sendAdminSuccess(res, { contentId: req.body.contentId || 'CNT-NEW', ...req.body }, null, 201);
});

// 176. PATCH /content/:contentId
router.patch('/content/:contentId', async (req, res) => {
  await recordAdminAudit({ action: 'CONTENT_UPDATED', entityType: 'CONTENT', entityId: req.params.contentId, req, newState: req.body });
  return sendAdminSuccess(res, { contentId: req.params.contentId, ...req.body });
});

// 177. POST /content/:contentId/publish
router.post('/content/:contentId/publish', async (req, res) => {
  await recordAdminAudit({ action: 'CONTENT_PUBLISHED', entityType: 'CONTENT', entityId: req.params.contentId, req });
  return sendAdminSuccess(res, { contentId: req.params.contentId, status: 'PUBLISHED' });
});

// 178. GET /content/:contentId/translations
router.get('/content/:contentId/translations', (req, res) => {
  return sendAdminSuccess(res, {
    contentId: req.params.contentId,
    translations: [
      { language: 'hi', title: 'डिजिटल बैंकिंग बेसिक्स', status: 'PUBLISHED' },
      { language: 'mr', title: 'डिजिटल बँकिंग मूलभूत', status: 'IN_REVIEW' },
    ]
  });
});

// 179. POST /content/:contentId/translations
router.post('/content/:contentId/translations', async (req, res) => {
  await recordAdminAudit({ action: 'TRANSLATION_ADDED', entityType: 'CONTENT', entityId: req.params.contentId, req, newState: req.body });
  return sendAdminSuccess(res, { contentId: req.params.contentId, ...req.body }, null, 201);
});

// 180. PATCH /content/:contentId/translations/:language
router.patch('/content/:contentId/translations/:language', async (req, res) => {
  await recordAdminAudit({ action: 'TRANSLATION_UPDATED', entityType: 'CONTENT', entityId: req.params.contentId, req, newState: req.body });
  return sendAdminSuccess(res, { contentId: req.params.contentId, language: req.params.language, ...req.body });
});

// 181. GET /learning/interactive
router.get('/learning/interactive', (req, res) => {
  return sendAdminSuccess(res, {
    exercises: [
      { exerciseId: 'EXE-01', title: 'Voucher Entry Simulation', type: 'INTERACTIVE_SANDBOX' },
    ]
  });
});

// 182. GET /learning/interactive/:id
router.get('/learning/interactive/:id', (req, res) => {
  return sendAdminSuccess(res, { exerciseId: req.params.id, title: 'Voucher Entry Simulation' });
});

// 183. POST /learning/interactive
router.post('/learning/interactive', async (req, res) => {
  await recordAdminAudit({ action: 'INTERACTIVE_EXERCISE_CREATED', entityType: 'INTERACTIVE_EXERCISE', entityId: req.body.exerciseId || 'EXE-NEW', req });
  return sendAdminSuccess(res, { exerciseId: req.body.exerciseId || 'EXE-NEW', ...req.body }, null, 201);
});

// 184. PATCH /learning/interactive/:id
router.patch('/learning/interactive/:id', async (req, res) => {
  await recordAdminAudit({ action: 'INTERACTIVE_EXERCISE_UPDATED', entityType: 'INTERACTIVE_EXERCISE', entityId: req.params.id, req, newState: req.body });
  return sendAdminSuccess(res, { exerciseId: req.params.id, ...req.body });
});

// 185. GET /offline-packages
router.get('/offline-packages', (req, res) => {
  const pkgs = [
    { packageId: 'PKG-01', name: 'PACS Core Training Bundle v1.4', sizeMb: 240, status: 'PUBLISHED', compatibleNodes: 20 },
  ];
  const result = paginateArray(pkgs, req.query.page, req.query.limit);
  return sendAdminSuccess(res, result.data, result.pagination);
});

// 186. GET /offline-packages/:id
router.get('/offline-packages/:id', (req, res) => {
  return sendAdminSuccess(res, { packageId: req.params.id, status: 'PUBLISHED', sizeMb: 240 });
});

// 187. POST /offline-packages
router.post('/offline-packages', async (req, res) => {
  await recordAdminAudit({ action: 'OFFLINE_PACKAGE_CREATED', entityType: 'OFFLINE_PACKAGE', entityId: req.body.packageId || 'PKG-NEW', req });
  return sendAdminSuccess(res, { packageId: req.body.packageId || 'PKG-NEW', ...req.body }, null, 201);
});

/* ══════════════════════════════════════════════════════════════════════════
   9. 📱 ATTENDANCE (15 Unique APIs)
   ══════════════════════════════════════════════════════════════════════════ */
// 188. POST /offline-packages/:id/build
router.post('/offline-packages/:id/build', async (req, res) => {
  await recordAdminAudit({ action: 'OFFLINE_PACKAGE_BUILD_INITIATED', entityType: 'OFFLINE_PACKAGE', entityId: req.params.id, req });
  return sendAdminSuccess(res, { packageId: req.params.id, status: 'BUILDING' });
});

// 189. POST /offline-packages/:id/publish
router.post('/offline-packages/:id/publish', async (req, res) => {
  await recordAdminAudit({ action: 'OFFLINE_PACKAGE_PUBLISHED', entityType: 'OFFLINE_PACKAGE', entityId: req.params.id, req });
  return sendAdminSuccess(res, { packageId: req.params.id, status: 'PUBLISHED' });
});

// 190. GET /offline-packages/:id/nodes
router.get('/offline-packages/:id/nodes', (req, res) => {
  return sendAdminSuccess(res, { packageId: req.params.id, deployedNodesCount: 20, syncedNodesCount: 19 });
});

// 191. GET /learning/progress
router.get('/learning/progress', async (req, res) => {
  try {
    const list = await LearningProgress.find().limit(20).lean();
    const result = paginateArray(list.length ? list : [
      { traineeId: 'TRN-001', courseId: 'CRS-001', progressPercent: 78, lastActivityAt: new Date() },
    ], req.query.page, req.query.limit);
    return sendAdminSuccess(res, result.data, result.pagination);
  } catch (e) {
    return sendAdminError(res, 'PROGRESS_ERROR', e.message);
  }
});

// 192. GET /learning/progress/analytics
router.get('/learning/progress/analytics', (req, res) => {
  return sendAdminSuccess(res, {
    averageCompletionRate: 82.7,
    fastLearnersPercentage: 24,
    stalledLearnersPercentage: 8,
  });
});

// 193. GET /attendance/live
router.get('/attendance/live', (req, res) => {
  return sendAdminSuccess(res, {
    activeSessionsCount: 42,
    livePresentLearners: 1240,
    averageAttendanceRate: 91.4,
  });
});

// 194. GET /attendance/sessions
router.get('/attendance/sessions', async (req, res) => {
  try {
    const list = await AttendanceSession.find().lean();
    const result = paginateArray(list, req.query.page, req.query.limit);
    return sendAdminSuccess(res, result.data, result.pagination);
  } catch (e) {
    return sendAdminError(res, 'SESSIONS_ERROR', e.message);
  }
});

// 195. GET /attendance/sessions/:sessionId
router.get('/attendance/sessions/:sessionId', async (req, res) => {
  try {
    const s = await AttendanceSession.findOne({ sessionId: req.params.sessionId }).lean();
    return sendAdminSuccess(res, s || { sessionId: req.params.sessionId, status: 'ACTIVE' });
  } catch (e) {
    return sendAdminError(res, 'SESSION_ERROR', e.message);
  }
});

// 196. GET /attendance/qr/sessions/:sessionId
router.get('/attendance/qr/sessions/:sessionId', (req, res) => {
  return sendAdminSuccess(res, {
    sessionId: req.params.sessionId,
    qrToken: `PRAGYAAN_QR_${Date.now()}`,
    expiresInSeconds: 30,
  });
});

// 197. POST /attendance/qr/sessions/:sessionId/rotate
router.post('/attendance/qr/sessions/:sessionId/rotate', (req, res) => {
  return sendAdminSuccess(res, {
    sessionId: req.params.sessionId,
    newQrToken: `PRAGYAAN_ROTATED_${Date.now()}`,
    expiresInSeconds: 30,
  });
});

// 198. GET /attendance/sessions/:sessionId/records
router.get('/attendance/sessions/:sessionId/records', async (req, res) => {
  try {
    const records = await AttendanceRecord.find({ sessionId: req.params.sessionId }).lean();
    return sendAdminSuccess(res, records);
  } catch (e) {
    return sendAdminError(res, 'RECORDS_ERROR', e.message);
  }
});

// 199. GET /attendance/face/sessions/:sessionId
router.get('/attendance/face/sessions/:sessionId', (req, res) => {
  return sendAdminSuccess(res, {
    sessionId: req.params.sessionId,
    faceMatchesCount: 38,
    averageConfidencePercent: 96.4,
  });
});

// 200. GET /attendance/face/review
router.get('/attendance/face/review', (req, res) => {
  return sendAdminSuccess(res, {
    flaggedReviews: [
      { reviewId: 'REV-01', traineeId: 'TRN-042', confidenceScore: 71.2, flagReason: 'LOW_CONFIDENCE_THRESHOLD' },
    ]
  });
});

// 201. GET /attendance/corrections
router.get('/attendance/corrections', (req, res) => {
  const list = [
    { correctionId: 'COR-01', traineeId: 'TRN-001', sessionDate: '2026-09-28', reason: 'Official edge biometric sync delayed', status: 'PENDING' },
  ];
  const result = paginateArray(list, req.query.page, req.query.limit);
  return sendAdminSuccess(res, result.data, result.pagination);
});

// 202. GET /attendance/corrections/:id
router.get('/attendance/corrections/:id', (req, res) => {
  return sendAdminSuccess(res, { correctionId: req.params.id, status: 'PENDING' });
});

/* ══════════════════════════════════════════════════════════════════════════
   10. 🏆 ASSESSMENTS & CERTIFICATION (20 Unique APIs)
   ══════════════════════════════════════════════════════════════════════════ */
// 203. POST /attendance/corrections/:id/approve
router.post('/attendance/corrections/:id/approve', async (req, res) => {
  await recordAdminAudit({ action: 'ATTENDANCE_CORRECTION_APPROVED', entityType: 'ATTENDANCE_CORRECTION', entityId: req.params.id, req });
  return sendAdminSuccess(res, { correctionId: req.params.id, status: 'APPROVED' });
});

// 204. POST /attendance/corrections/:id/reject
router.post('/attendance/corrections/:id/reject', async (req, res) => {
  await recordAdminAudit({ action: 'ATTENDANCE_CORRECTION_REJECTED', entityType: 'ATTENDANCE_CORRECTION', entityId: req.params.id, req });
  return sendAdminSuccess(res, { correctionId: req.params.id, status: 'REJECTED' });
});

// 205. GET /attendance/analytics
router.get('/attendance/analytics', (req, res) => {
  return sendAdminSuccess(res, {
    overallAttendancePercentage: 91.4,
    totalSessionsConducted: 4200,
    qrMethodPercentage: 68,
    biometricMethodPercentage: 32,
  });
});

// 206. GET /attendance/analytics/trends
router.get('/attendance/analytics/trends', (req, res) => {
  return sendAdminSuccess(res, {
    trends: [
      { week: 'W1', rate: 90.2 },
      { week: 'W2', rate: 91.1 },
      { week: 'W3', rate: 91.8 },
      { week: 'W4', rate: 91.4 },
    ]
  });
});

// 207. GET /attendance/analytics/institutes
router.get('/attendance/analytics/institutes', async (req, res) => {
  try {
    const list = await Institute.find().select('instituteId name attendanceRate').lean();
    return sendAdminSuccess(res, list);
  } catch (e) {
    return sendAdminError(res, 'ATTENDANCE_INST_ERROR', e.message);
  }
});

// 208. GET /assessments
router.get('/assessments', async (req, res) => {
  try {
    const list = await Assessment.find().lean();
    const result = paginateArray(list, req.query.page, req.query.limit);
    return sendAdminSuccess(res, result.data, result.pagination);
  } catch (e) {
    return sendAdminError(res, 'ASSESSMENTS_ERROR', e.message);
  }
});

// 209. GET /assessments/:id
router.get('/assessments/:id', async (req, res) => {
  try {
    const a = await Assessment.findOne({ assessmentId: req.params.id }).lean();
    return sendAdminSuccess(res, a || { assessmentId: req.params.id, totalMarks: 100 });
  } catch (e) {
    return sendAdminError(res, 'ASSESSMENT_ERROR', e.message);
  }
});

// 210. POST /assessments
router.post('/assessments', async (req, res) => {
  try {
    const a = new Assessment(req.body);
    await a.save();
    await recordAdminAudit({ action: 'ASSESSMENT_CREATED', entityType: 'ASSESSMENT', entityId: a.assessmentId, req });
    return sendAdminSuccess(res, a, null, 201);
  } catch (e) {
    return sendAdminError(res, 'ASSESSMENT_CREATE_ERROR', e.message);
  }
});

// 211. PATCH /assessments/:id
router.patch('/assessments/:id', async (req, res) => {
  await recordAdminAudit({ action: 'ASSESSMENT_UPDATED', entityType: 'ASSESSMENT', entityId: req.params.id, req, newState: req.body });
  return sendAdminSuccess(res, { assessmentId: req.params.id, ...req.body });
});

// 212. POST /assessments/:id/publish
router.post('/assessments/:id/publish', async (req, res) => {
  await recordAdminAudit({ action: 'ASSESSMENT_PUBLISHED', entityType: 'ASSESSMENT', entityId: req.params.id, req });
  return sendAdminSuccess(res, { assessmentId: req.params.id, status: 'PUBLISHED' });
});

// 213. GET /questions
router.get('/questions', async (req, res) => {
  try {
    const list = await QuestionBank.find().lean();
    const result = paginateArray(list.length ? list : [
      { questionId: 'Q-01', text: 'What is the minimum share capital for a Primary Agricultural Credit Society?', difficulty: 'MEDIUM' },
    ], req.query.page, req.query.limit);
    return sendAdminSuccess(res, result.data, result.pagination);
  } catch (e) {
    return sendAdminError(res, 'QUESTIONS_ERROR', e.message);
  }
});

// 214. GET /questions/:id
router.get('/questions/:id', (req, res) => {
  return sendAdminSuccess(res, { questionId: req.params.id, text: 'Sample Question' });
});

// 215. POST /questions
router.post('/questions', async (req, res) => {
  await recordAdminAudit({ action: 'QUESTION_CREATED', entityType: 'QUESTION', entityId: req.body.questionId || 'Q-NEW', req });
  return sendAdminSuccess(res, { questionId: req.body.questionId || 'Q-NEW', ...req.body }, null, 201);
});

// 216. PATCH /questions/:id
router.patch('/questions/:id', async (req, res) => {
  await recordAdminAudit({ action: 'QUESTION_UPDATED', entityType: 'QUESTION', entityId: req.params.id, req, newState: req.body });
  return sendAdminSuccess(res, { questionId: req.params.id, ...req.body });
});

// 217. GET /offline-assessments
router.get('/offline-assessments', (req, res) => {
  return sendAdminSuccess(res, {
    offlinePackages: [
      { packageId: 'ASM-OFF-01', name: 'Batch 04 Final Offline Exam Bundle', status: 'SYNCED_TO_ALL_NODES' },
    ]
  });
});

// 218. GET /offline-assessments/:id
router.get('/offline-assessments/:id', (req, res) => {
  return sendAdminSuccess(res, { packageId: req.params.id, status: 'READY' });
});

// 219. GET /offline-assessments/:id/sync-status
router.get('/offline-assessments/:id/sync-status', (req, res) => {
  return sendAdminSuccess(res, { packageId: req.params.id, syncedNodes: 20, totalNodes: 20 });
});

// 220. GET /results
router.get('/results', (req, res) => {
  const results = [
    { resultId: 'RES-01', traineeId: 'TRN-001', score: 88, grade: 'A', status: 'PUBLISHED' },
    { resultId: 'RES-02', traineeId: 'TRN-002', score: 92, grade: 'A+', status: 'PUBLISHED' },
  ];
  const r = paginateArray(results, req.query.page, req.query.limit);
  return sendAdminSuccess(res, r.data, r.pagination);
});

// 221. GET /results/:id
router.get('/results/:id', (req, res) => {
  return sendAdminSuccess(res, { resultId: req.params.id, score: 88, status: 'PUBLISHED' });
});

// 222. POST /results/:id/verify
router.post('/results/:id/verify', async (req, res) => {
  await recordAdminAudit({ action: 'RESULT_VERIFIED', entityType: 'RESULT', entityId: req.params.id, req });
  return sendAdminSuccess(res, { resultId: req.params.id, status: 'VERIFIED' });
});

/* ══════════════════════════════════════════════════════════════════════════
   11. ✨ SKILLS & CAREER (17 Unique APIs)
   ══════════════════════════════════════════════════════════════════════════ */
// 223. POST /results/:id/publish
router.post('/results/:id/publish', async (req, res) => {
  await recordAdminAudit({ action: 'RESULT_PUBLISHED', entityType: 'RESULT', entityId: req.params.id, req });
  return sendAdminSuccess(res, { resultId: req.params.id, status: 'PUBLISHED' });
});

// 224. GET /certificates
router.get('/certificates', async (req, res) => {
  try {
    const list = await Certificate.find().lean();
    const result = paginateArray(list, req.query.page, req.query.limit);
    return sendAdminSuccess(res, result.data, result.pagination);
  } catch (e) {
    return sendAdminError(res, 'CERTIFICATES_ERROR', e.message);
  }
});

// 225. GET /certificates/:id
router.get('/certificates/:id', async (req, res) => {
  try {
    const c = await Certificate.findOne({ $or: [{ certificateId: req.params.id }, { credentialId: req.params.id }] }).lean();
    return sendAdminSuccess(res, c || { certificateId: req.params.id, status: 'ISSUED' });
  } catch (e) {
    return sendAdminError(res, 'CERT_ERROR', e.message);
  }
});

// 226. POST /certificates/:id/issue
router.post('/certificates/:id/issue', async (req, res) => {
  await Certificate.updateOne({ certificateId: req.params.id }, { $set: { status: 'ISSUED' } });
  await recordAdminAudit({ action: 'CERTIFICATE_ISSUED', entityType: 'CERTIFICATE', entityId: req.params.id, req });
  return sendAdminSuccess(res, { certificateId: req.params.id, status: 'ISSUED', issuedAt: new Date() });
});

// 227. POST /certificates/:id/revoke
router.post('/certificates/:id/revoke', async (req, res) => {
  await Certificate.updateOne({ certificateId: req.params.id }, { $set: { status: 'REVOKED', revokedAt: new Date() } });
  await recordAdminAudit({ action: 'CERTIFICATE_REVOKED', entityType: 'CERTIFICATE', entityId: req.params.id, req, reason: req.body.reason });
  return sendAdminSuccess(res, { certificateId: req.params.id, status: 'REVOKED', revokedAt: new Date() });
});

// 228. GET /skills/tree
router.get('/skills/tree', (req, res) => {
  return sendAdminSuccess(res, {
    tree: [
      { category: 'Cooperative Governance', skills: ['Board Protocols', 'Byelaw Compliance'] },
      { category: 'Financial Accounting', skills: ['Double Entry', 'Balance Sheet Formulation', 'Statutory Audit'] },
      { category: 'Digital Banking', skills: ['AEPS Protocols', 'CBS Data Migration', 'Micro-ATM Operations'] },
    ]
  });
});

// 229. GET /skills
router.get('/skills', async (req, res) => {
  try {
    const list = await Skill.find().lean();
    const result = paginateArray(list, req.query.page, req.query.limit);
    return sendAdminSuccess(res, result.data, result.pagination);
  } catch (e) {
    return sendAdminError(res, 'SKILLS_ERROR', e.message);
  }
});

// 230. GET /skills/:skillId
router.get('/skills/:skillId', async (req, res) => {
  try {
    const s = await Skill.findOne({ skillId: req.params.skillId }).lean();
    return sendAdminSuccess(res, s || { skillId: req.params.skillId, name: 'PACS Accounting' });
  } catch (e) {
    return sendAdminError(res, 'SKILL_ERROR', e.message);
  }
});

// 231. POST /skills
router.post('/skills', async (req, res) => {
  try {
    const s = new Skill(req.body);
    await s.save();
    await recordAdminAudit({ action: 'SKILL_CREATED', entityType: 'SKILL', entityId: s.skillId, req });
    return sendAdminSuccess(res, s, null, 201);
  } catch (e) {
    return sendAdminError(res, 'SKILL_CREATE_ERROR', e.message);
  }
});

// 232. PATCH /skills/:skillId
router.patch('/skills/:skillId', async (req, res) => {
  await recordAdminAudit({ action: 'SKILL_UPDATED', entityType: 'SKILL', entityId: req.params.skillId, req, newState: req.body });
  return sendAdminSuccess(res, { skillId: req.params.skillId, ...req.body });
});

// 233. GET /skill-profiles
router.get('/skill-profiles', (req, res) => {
  const profiles = [
    { traineeId: 'TRN-001', verifiedSkillsCount: 6, averageProficiency: 3.2 },
  ];
  const r = paginateArray(profiles, req.query.page, req.query.limit);
  return sendAdminSuccess(res, r.data, r.pagination);
});

// 234. GET /skill-profiles/:traineeId
router.get('/skill-profiles/:traineeId', (req, res) => {
  return sendAdminSuccess(res, { traineeId: req.params.traineeId, verifiedSkills: [{ name: 'Accounting', level: 3 }] });
});

// 235. GET /skill-gaps
router.get('/skill-gaps', (req, res) => {
  return sendAdminSuccess(res, {
    topDeficits: [
      { skill: 'Digital Banking CBS Integration', deficitPercentage: 42 },
      { skill: 'Cyber Security Auditing', deficitPercentage: 38 },
    ]
  });
});

// 236. GET /skill-gaps/heatmap
router.get('/skill-gaps/heatmap', (req, res) => {
  return sendAdminSuccess(res, {
    zones: [
      { zone: 'Northern', gapScore: 68 },
      { zone: 'Western', gapScore: 42 },
      { zone: 'Southern', gapScore: 35 },
      { zone: 'Eastern', gapScore: 74 },
    ]
  });
});

// 237. GET /skill-gaps/institutes
router.get('/skill-gaps/institutes', (req, res) => {
  return sendAdminSuccess(res, {
    instituteGaps: [
      { instituteId: 'INST-ICM-IMPHAL', deficitSkill: 'Digital CBS' },
      { instituteId: 'INST-ICM-LKO', deficitSkill: 'Statutory Compliance' },
    ]
  });
});

// 238. GET /recommendations/courses
router.get('/recommendations/courses', (req, res) => {
  return sendAdminSuccess(res, {
    recommendations: [
      { courseId: 'CRS-001', title: 'PACS Cyber Hygiene', reason: 'High Industry Demand in Northern Zone' },
    ]
  });
});

// 239. POST /recommendations/preview
router.post('/recommendations/preview', (req, res) => {
  return sendAdminSuccess(res, {
    simulatedMatchesCount: 42,
    expectedPlacementLiftPercentage: 14.5,
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   12. 💼 EMPLOYERS & EMPLOYMENT (24 Unique APIs)
   ══════════════════════════════════════════════════════════════════════════ */
// 240. GET /career/profiles
router.get('/career/profiles', (req, res) => {
  const profiles = [
    { profileId: 'CAR-01', candidateName: 'Raj Kumar', readinessIndex: 88, matchedVacancies: 4 },
  ];
  const r = paginateArray(profiles, req.query.page, req.query.limit);
  return sendAdminSuccess(res, r.data, r.pagination);
});

// 241. GET /career/readiness
router.get('/career/readiness', (req, res) => {
  return sendAdminSuccess(res, {
    highReadinessPercentage: 54,
    mediumReadinessPercentage: 34,
    emergingReadinessPercentage: 12,
  });
});

// 242. GET /career/pathways
router.get('/career/pathways', (req, res) => {
  return sendAdminSuccess(res, {
    pathways: [
      { fromRole: 'Trainee', intermediate: 'PACS Clerk', apexRole: 'Branch Manager / CEO' },
    ]
  });
});

// 243. POST /ai/career/chat
router.post('/ai/career/chat', (req, res) => {
  return sendAdminSuccess(res, {
    reply: 'Based on your verified skills in PACS Accounting and Double Entry, you are an 88% match for Digital Banking Officer at MSCB.',
    suggestedCertifications: ['CERT-02 (Cyber Compliance)'],
  });
});

// 244. GET /ai/career/conversations
router.get('/ai/career/conversations', (req, res) => {
  return sendAdminSuccess(res, { conversations: [] });
});

// 245. GET /employers
router.get('/employers', (req, res) => {
  const employers = [
    { employerId: 'EMP-001', name: 'Gujarat Co-operative Milk Marketing Federation (Amul)', sector: 'Dairy Cooperative', verified: true, activeVacancies: 12 },
    { employerId: 'EMP-002', name: 'IFFCO Kisan Sanchar Ltd', sector: 'Agri-Fintech', verified: true, activeVacancies: 8 },
  ];
  const r = paginateArray(employers, req.query.page, req.query.limit);
  return sendAdminSuccess(res, r.data, r.pagination);
});

// 246. GET /employers/:id
router.get('/employers/:id', (req, res) => {
  return sendAdminSuccess(res, { employerId: req.params.id, name: 'Sample Employer', verified: true });
});

// 247. POST /employers
router.post('/employers', async (req, res) => {
  await recordAdminAudit({ action: 'EMPLOYER_ONBOARDED', entityType: 'EMPLOYER', entityId: req.body.employerId || 'EMP-NEW', req });
  return sendAdminSuccess(res, { employerId: req.body.employerId || 'EMP-NEW', ...req.body }, null, 201);
});

// 248. PATCH /employers/:id
router.patch('/employers/:id', async (req, res) => {
  await recordAdminAudit({ action: 'EMPLOYER_UPDATED', entityType: 'EMPLOYER', entityId: req.params.id, req, newState: req.body });
  return sendAdminSuccess(res, { employerId: req.params.id, ...req.body });
});

// 249. GET /employers/verification
router.get('/employers/verification', (req, res) => {
  return sendAdminSuccess(res, { pendingVerifications: [] });
});

// 250. POST /employers/:id/verify
router.post('/employers/:id/verify', async (req, res) => {
  await recordAdminAudit({ action: 'EMPLOYER_VERIFIED', entityType: 'EMPLOYER', entityId: req.params.id, req });
  return sendAdminSuccess(res, { employerId: req.params.id, verified: true, verifiedAt: new Date() });
});

// 251. POST /employers/:id/reject
router.post('/employers/:id/reject', async (req, res) => {
  await recordAdminAudit({ action: 'EMPLOYER_VERIFICATION_REJECTED', entityType: 'EMPLOYER', entityId: req.params.id, req, reason: req.body.reason });
  return sendAdminSuccess(res, { employerId: req.params.id, verified: false });
});

// 252. GET /vacancies
router.get('/vacancies', async (req, res) => {
  try {
    const list = await Vacancy.find().lean();
    const result = paginateArray(list, req.query.page, req.query.limit);
    return sendAdminSuccess(res, result.data, result.pagination);
  } catch (e) {
    return sendAdminError(res, 'VACANCIES_ERROR', e.message);
  }
});

// 253. GET /vacancies/:id
router.get('/vacancies/:id', async (req, res) => {
  try {
    const v = await Vacancy.findOne({ vacancyId: req.params.id }).lean();
    return sendAdminSuccess(res, v || { vacancyId: req.params.id, title: 'Banking Assistant' });
  } catch (e) {
    return sendAdminError(res, 'VACANCY_ERROR', e.message);
  }
});

// 254. POST /vacancies
router.post('/vacancies', async (req, res) => {
  try {
    const v = new Vacancy(req.body);
    await v.save();
    await recordAdminAudit({ action: 'VACANCY_POSTED', entityType: 'VACANCY', entityId: v.vacancyId, req });
    return sendAdminSuccess(res, v, null, 201);
  } catch (e) {
    return sendAdminError(res, 'VACANCY_CREATE_ERROR', e.message);
  }
});

// 255. PATCH /vacancies/:id
router.patch('/vacancies/:id', async (req, res) => {
  await recordAdminAudit({ action: 'VACANCY_UPDATED', entityType: 'VACANCY', entityId: req.params.id, req, newState: req.body });
  return sendAdminSuccess(res, { vacancyId: req.params.id, ...req.body });
});

// 256. PATCH /vacancies/:id/status
router.patch('/vacancies/:id/status', async (req, res) => {
  await recordAdminAudit({ action: 'VACANCY_STATUS_CHANGED', entityType: 'VACANCY', entityId: req.params.id, req, newState: { status: req.body.status } });
  return sendAdminSuccess(res, { vacancyId: req.params.id, status: req.body.status });
});

// 257. GET /matching/vacancies/:vacancyId/candidates
router.get('/matching/vacancies/:vacancyId/candidates', (req, res) => {
  return sendAdminSuccess(res, {
    vacancyId: req.params.vacancyId,
    candidates: [
      { candidateId: 'TRN-001', matchScore: 92, verifiedSkills: ['Accounting', 'Audit'], missingSkills: [] },
    ]
  });
});

// 258. POST /matching/preview
router.post('/matching/preview', (req, res) => {
  return sendAdminSuccess(res, { previewCandidatesCount: 18, averageMatchScore: 84.5 });
});

// 259. GET /job-applications
router.get('/job-applications', async (req, res) => {
  try {
    const list = await JobApplication.find().lean();
    const result = paginateArray(list.length ? list : [
      { applicationId: 'JOB-APP-01', candidateName: 'Pooja Verma', vacancyTitle: 'Digital Banking Officer', status: 'SHORTLISTED' },
    ], req.query.page, req.query.limit);
    return sendAdminSuccess(res, result.data, result.pagination);
  } catch (e) {
    return sendAdminError(res, 'JOB_APPS_ERROR', e.message);
  }
});

// 260. GET /job-applications/:id
router.get('/job-applications/:id', (req, res) => {
  return sendAdminSuccess(res, { applicationId: req.params.id, status: 'SHORTLISTED' });
});

// 261. PATCH /job-applications/:id/status
router.patch('/job-applications/:id/status', async (req, res) => {
  await recordAdminAudit({ action: 'JOB_APPLICATION_STATUS_UPDATED', entityType: 'JOB_APPLICATION', entityId: req.params.id, req, newState: { status: req.body.status } });
  return sendAdminSuccess(res, { applicationId: req.params.id, status: req.body.status });
});

// 262. GET /interviews
router.get('/interviews', (req, res) => {
  return sendAdminSuccess(res, {
    interviews: [
      { interviewId: 'INT-01', candidateId: 'TRN-001', scheduledAt: '2026-10-05T10:00:00Z', format: 'VIRTUAL' },
    ]
  });
});

// 263. POST /interviews
router.post('/interviews', async (req, res) => {
  await recordAdminAudit({ action: 'INTERVIEW_SCHEDULED', entityType: 'INTERVIEW', entityId: req.body.interviewId || 'INT-NEW', req });
  return sendAdminSuccess(res, { interviewId: req.body.interviewId || 'INT-NEW', ...req.body }, null, 201);
});

/* ══════════════════════════════════════════════════════════════════════════
   13. 📈 TNA & INTELLIGENCE (14 Unique APIs)
   ══════════════════════════════════════════════════════════════════════════ */
// 264. PATCH /interviews/:id
router.patch('/interviews/:id', async (req, res) => {
  await recordAdminAudit({ action: 'INTERVIEW_UPDATED', entityType: 'INTERVIEW', entityId: req.params.id, req, newState: req.body });
  return sendAdminSuccess(res, { interviewId: req.params.id, ...req.body });
});

// 265. GET /employment-outcomes
router.get('/employment-outcomes', async (req, res) => {
  try {
    const list = await EmploymentOutcome.find().lean();
    const result = paginateArray(list.length ? list : [
      { outcomeId: 'OUT-01', traineeId: 'TRN-001', employerName: 'Amul', salaryPerAnnum: 450000, status: 'CONFIRMED' },
    ], req.query.page, req.query.limit);
    return sendAdminSuccess(res, result.data, result.pagination);
  } catch (e) {
    return sendAdminError(res, 'OUTCOMES_ERROR', e.message);
  }
});

// 266. GET /employment-outcomes/:id
router.get('/employment-outcomes/:id', (req, res) => {
  return sendAdminSuccess(res, { outcomeId: req.params.id, status: 'CONFIRMED' });
});

// 267. POST /employment-outcomes
router.post('/employment-outcomes', async (req, res) => {
  await recordAdminAudit({ action: 'OUTCOME_RECORDED', entityType: 'EMPLOYMENT_OUTCOME', entityId: req.body.outcomeId || 'OUT-NEW', req });
  return sendAdminSuccess(res, { outcomeId: req.body.outcomeId || 'OUT-NEW', ...req.body }, null, 201);
});

// 268. PATCH /employment-outcomes/:id
router.patch('/employment-outcomes/:id', async (req, res) => {
  await recordAdminAudit({ action: 'OUTCOME_UPDATED', entityType: 'EMPLOYMENT_OUTCOME', entityId: req.params.id, req, newState: req.body });
  return sendAdminSuccess(res, { outcomeId: req.params.id, ...req.body });
});

// 269. GET /tna
router.get('/tna', (req, res) => {
  return sendAdminSuccess(res, {
    tnaAnalyses: [
      { tnaId: 'TNA-2026-01', sector: 'PACS Computerization', demandSurgePercent: 68, recommendedBatches: 24 },
    ]
  });
});

// 270. GET /tna/:id
router.get('/tna/:id', (req, res) => {
  return sendAdminSuccess(res, { tnaId: req.params.id, recommendedFocus: 'Cyber Risk Audits' });
});

// 271. POST /tna
router.post('/tna', async (req, res) => {
  await recordAdminAudit({ action: 'TNA_ANALYSIS_EXECUTED', entityType: 'TNA', entityId: req.body.tnaId || 'TNA-NEW', req });
  return sendAdminSuccess(res, { tnaId: req.body.tnaId || 'TNA-NEW', ...req.body }, null, 201);
});

// 272. PATCH /tna/:id
router.patch('/tna/:id', async (req, res) => {
  await recordAdminAudit({ action: 'TNA_ANALYSIS_MODIFIED', entityType: 'TNA', entityId: req.params.id, req, newState: req.body });
  return sendAdminSuccess(res, { tnaId: req.params.id, ...req.body });
});

// 273. GET /intelligence/skill-demand
router.get('/intelligence/skill-demand', (req, res) => {
  return sendAdminSuccess(res, {
    topDemandedSkills: [
      { skill: 'PACS Micro-Banking Core', growthRatePercentage: 84 },
      { skill: 'Audit Trail Forensic Analysis', growthRatePercentage: 76 },
    ]
  });
});

// 274. GET /intelligence/skill-demand/trends
router.get('/intelligence/skill-demand/trends', (req, res) => {
  return sendAdminSuccess(res, {
    demandForecastMonths: ['Q3-26', 'Q4-26', 'Q1-27', 'Q2-27'],
    predictedVacancies: [1200, 1850, 2400, 3100],
  });
});

// 275. GET /intelligence/skill-gaps
router.get('/intelligence/skill-gaps', (req, res) => {
  return sendAdminSuccess(res, {
    criticalGaps: [
      { sector: 'Multi-State Cooperatives', gapRatio: 0.42 },
    ]
  });
});

// 276. GET /intelligence/skill-gaps/heatmap
router.get('/intelligence/skill-gaps/heatmap', (req, res) => {
  return sendAdminSuccess(res, {
    heatmap: [
      { state: 'Uttar Pradesh', deficitIndex: 78 },
      { state: 'Maharashtra', deficitIndex: 42 },
      { state: 'Bihar', deficitIndex: 82 },
      { state: 'Karnataka', deficitIndex: 39 },
    ]
  });
});

// 277. GET /intelligence/programme-effectiveness
router.get('/intelligence/programme-effectiveness', (req, res) => {
  return sendAdminSuccess(res, {
    averageProgrammeScore: 84.6,
    effectivenessFactors: ['Attendance', 'Assessment', 'Certification', 'Placement'],
  });
});

// 278. GET /intelligence/programmes/:programmeId
router.get('/intelligence/programmes/:programmeId', (req, res) => {
  return sendAdminSuccess(res, {
    programmeId: req.params.programmeId,
    enrollment: 320,
    attendanceRate: 91.2,
    completionRate: 82.4,
    assessmentPassRate: 79.8,
    certificateRate: 76.2,
    skillVerificationRate: 71.5,
    employmentOutcomeRate: 43.1,
  });
});

// 279. GET /intelligence/institute-comparison
router.get('/intelligence/institute-comparison', async (req, res) => {
  try {
    const list = await Institute.find().select('instituteId name attendanceRate completionRate').lean();
    return sendAdminSuccess(res, list);
  } catch (e) {
    return sendAdminError(res, 'INSTITUTE_COMPARE_ERROR', e.message);
  }
});

// 280. GET /intelligence/outcomes
router.get('/intelligence/outcomes', (req, res) => {
  return sendAdminSuccess(res, {
    totalTrained: 12480,
    totalPlaced: 2184,
    averageSalaryInr: 380000,
  });
});

// 281. GET /intelligence/training-to-employment
router.get('/intelligence/training-to-employment', (req, res) => {
  return sendAdminSuccess(res, {
    conversionRate: 31.9,
    targetRate: 40.0,
  });
});

// 282. GET /intelligence/feedback-loop
router.get('/intelligence/feedback-loop', (req, res) => {
  return sendAdminSuccess(res, {
    curriculumReviewFlagsCount: 3,
    employerSatisfactionScore: 4.6,
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   14. 📊 ANALYTICS & REPORTS (15 Unique APIs)
   ══════════════════════════════════════════════════════════════════════════ */
// 283. GET /analytics/hq
router.get('/analytics/hq', (req, res) => {
  return sendAdminSuccess(res, {
    totalBudgetUtilizedInr: 45000000,
    activeLearnersCount: 12480,
    certificationVelocityPerMonth: 850,
  });
});

// 284. GET /analytics/institutes
router.get('/analytics/institutes', async (req, res) => {
  try {
    const list = await Institute.find().lean();
    return sendAdminSuccess(res, list);
  } catch (e) {
    return sendAdminError(res, 'ANALYTICS_INST_ERROR', e.message);
  }
});

// 285. GET /analytics/institutes/:id
router.get('/analytics/institutes/:id', (req, res) => {
  return sendAdminSuccess(res, { instituteId: req.params.id, performanceScore: 92 });
});

// 286. GET /analytics/learners
router.get('/analytics/learners', (req, res) => {
  return sendAdminSuccess(res, {
    totalEnrolled: 12480,
    activeDailyAppUsers: 8420,
    averageDailyHours: 1.8,
  });
});

// 287. GET /analytics/training
router.get('/analytics/training', (req, res) => {
  return sendAdminSuccess(res, {
    completedBatches: 210,
    ongoingBatches: 132,
    trainerSatisfaction: 4.8,
  });
});

// 288. GET /analytics/employment
router.get('/analytics/employment', (req, res) => {
  return sendAdminSuccess(res, {
    placedLearners: 2184,
    cooperativeEmployersCount: 428,
  });
});

// 289. GET /dashboards
router.get('/dashboards', (req, res) => {
  return sendAdminSuccess(res, {
    dashboards: [
      { id: 'DASH-01', name: 'National Executive Cockpit', default: true },
      { id: 'DASH-02', name: 'PACS Regional Telemetry', default: false },
    ]
  });
});

// 290. GET /dashboards/:id
router.get('/dashboards/:id', (req, res) => {
  return sendAdminSuccess(res, { id: req.params.id, name: 'Custom Dashboard' });
});

// 291. POST /dashboards
router.post('/dashboards', async (req, res) => {
  await recordAdminAudit({ action: 'DASHBOARD_CREATED', entityType: 'DASHBOARD', entityId: req.body.id || 'DASH-NEW', req });
  return sendAdminSuccess(res, { id: req.body.id || 'DASH-NEW', ...req.body }, null, 201);
});

// 292. PATCH /dashboards/:id
router.patch('/dashboards/:id', async (req, res) => {
  await recordAdminAudit({ action: 'DASHBOARD_UPDATED', entityType: 'DASHBOARD', entityId: req.params.id, req, newState: req.body });
  return sendAdminSuccess(res, { id: req.params.id, ...req.body });
});

// 293. DELETE /dashboards/:id
router.delete('/dashboards/:id', async (req, res) => {
  await recordAdminAudit({ action: 'DASHBOARD_DELETED', entityType: 'DASHBOARD', entityId: req.params.id, req });
  return sendAdminSuccess(res, { id: req.params.id, deleted: true });
});

// 294. GET /reports/schedules
router.get('/reports/schedules', (req, res) => {
  return sendAdminSuccess(res, {
    schedules: [
      { scheduleId: 'SCH-01', reportName: 'Weekly Executive Brief', frequency: 'WEEKLY', format: 'PDF', recipients: ['admin@pragyaan.gov.in'] },
    ]
  });
});

// 295. POST /reports/schedules
router.post('/reports/schedules', async (req, res) => {
  await recordAdminAudit({ action: 'REPORT_SCHEDULE_CREATED', entityType: 'REPORT_SCHEDULE', entityId: req.body.scheduleId || 'SCH-NEW', req });
  return sendAdminSuccess(res, { scheduleId: req.body.scheduleId || 'SCH-NEW', ...req.body }, null, 201);
});

// 296. PATCH /reports/schedules/:id
router.patch('/reports/schedules/:id', async (req, res) => {
  await recordAdminAudit({ action: 'REPORT_SCHEDULE_UPDATED', entityType: 'REPORT_SCHEDULE', entityId: req.params.id, req, newState: req.body });
  return sendAdminSuccess(res, { scheduleId: req.params.id, ...req.body });
});

// 297. DELETE /reports/schedules/:id
router.delete('/reports/schedules/:id', async (req, res) => {
  await recordAdminAudit({ action: 'REPORT_SCHEDULE_DELETED', entityType: 'REPORT_SCHEDULE', entityId: req.params.id, req });
  return sendAdminSuccess(res, { scheduleId: req.params.id, deleted: true });
});

/* ══════════════════════════════════════════════════════════════════════════
   15. 🤖 AI ASSISTANT (10 Unique APIs)
   ══════════════════════════════════════════════════════════════════════════ */
// 298. POST /ai/chat
router.post('/ai/chat', (req, res) => {
  const q = req.body.message || '';
  return sendAdminSuccess(res, {
    messageId: `MSG-${Date.now()}`,
    conversationId: req.body.conversationId || 'CONV-001',
    answer: `Analysis for "${q}": There are 20 constituent institutes operating across India with an average attendance rate of 91.4%. 19 nodes are currently online with STN edge hardware telemetry active.`,
    sources: [
      { type: 'ATTENDANCE_ANALYTICS', reference: 'DB: AttendanceSession' },
      { type: 'EDGE_TELEMETRY', reference: 'DB: DeviceRegistry' },
    ],
    data: {
      totalInstitutes: 20,
      activeProgrammes: 186,
    }
  });
});

// 299. GET /ai/conversations
router.get('/ai/conversations', (req, res) => {
  return sendAdminSuccess(res, {
    conversations: [
      { conversationId: 'CONV-001', title: 'Institute Attendance Inquiry', updatedAt: new Date() },
    ]
  });
});

// 300. GET /ai/conversations/:id
router.get('/ai/conversations/:id', (req, res) => {
  return sendAdminSuccess(res, {
    conversationId: req.params.id,
    messages: [
      { sender: 'USER', text: 'How many institutes are below 75% attendance?' },
      { sender: 'AI', text: 'Three institutes currently need attention: ICM Imphal, ICM Guwahati, and ICM Dehradun.' },
    ]
  });
});

// 301. POST /ai/knowledge/query
router.post('/ai/knowledge/query', (req, res) => {
  return sendAdminSuccess(res, {
    query: req.body.query,
    matchedDocuments: [
      { title: 'National Council for Cooperative Training Guidelines 2026', relevance: 0.94 },
    ]
  });
});

// 302. GET /ai/knowledge/sources
router.get('/ai/knowledge/sources', (req, res) => {
  return sendAdminSuccess(res, {
    indexedSources: [
      { sourceId: 'SRC-01', name: 'NCCT Operational Manual', documentsCount: 14 },
      { sourceId: 'SRC-02', name: 'PACS Computerization Standard Protocol', documentsCount: 28 },
    ]
  });
});

// 303. POST /ai/skill-intelligence/query
router.post('/ai/skill-intelligence/query', (req, res) => {
  return sendAdminSuccess(res, {
    projectedShortageSkill: 'Multi-State Cooperative Banking Forensics',
    recommendedBatchesToAdd: 12,
  });
});

// 304. GET /ai/usage
router.get('/ai/usage', (req, res) => {
  return sendAdminSuccess(res, {
    totalPromptTokens: 842000,
    totalCompletionTokens: 215000,
    activeUserSessions: 420,
  });
});

// 305. GET /ai/activity
router.get('/ai/activity', (req, res) => {
  return sendAdminSuccess(res, {
    recentInteractionsCount: 142,
    averageLatencyMs: 420,
  });
});

// 306. GET /ai/safety-events
router.get('/ai/safety-events', (req, res) => {
  return sendAdminSuccess(res, {
    safetyEvents: []
  });
});

// 307. POST /ai/safety-events/resolve
router.post('/ai/safety-events/resolve', async (req, res) => {
  await recordAdminAudit({ action: 'AI_SAFETY_EVENT_RESOLVED', entityType: 'AI_SAFETY', entityId: req.body.eventId || 'EVT-01', req });
  return sendAdminSuccess(res, { resolved: true, eventId: req.body.eventId || 'EVT-01' });
});

/* ══════════════════════════════════════════════════════════════════════════
   16. ⚙️ ADMINISTRATION (20 Unique APIs)
   ══════════════════════════════════════════════════════════════════════════ */
// 308. GET /finance/budgets
router.get('/finance/budgets', async (req, res) => {
  try {
    const list = await ProgrammeBudget.find().lean();
    const result = paginateArray(list.length ? list : [
      { budgetId: 'BUD-001', programmeId: 'PRG-001', allocated: 5000000, committed: 3200000, utilized: 2700000, remaining: 2300000, financialYear: '2026-27' },
    ], req.query.page, req.query.limit);
    return sendAdminSuccess(res, result.data, result.pagination);
  } catch (e) {
    return sendAdminError(res, 'BUDGETS_ERROR', e.message);
  }
});

// 309. GET /finance/budgets/:id
router.get('/finance/budgets/:id', (req, res) => {
  return sendAdminSuccess(res, { budgetId: req.params.id, allocated: 5000000, utilized: 2700000 });
});

// 310. POST /finance/budgets
router.post('/finance/budgets', async (req, res) => {
  await recordAdminAudit({ action: 'BUDGET_ALLOCATED', entityType: 'FINANCE_BUDGET', entityId: req.body.budgetId || 'BUD-NEW', req });
  return sendAdminSuccess(res, { budgetId: req.body.budgetId || 'BUD-NEW', ...req.body }, null, 201);
});

// 311. PATCH /finance/budgets/:id
router.patch('/finance/budgets/:id', async (req, res) => {
  await recordAdminAudit({ action: 'BUDGET_UPDATED', entityType: 'FINANCE_BUDGET', entityId: req.params.id, req, newState: req.body });
  return sendAdminSuccess(res, { budgetId: req.params.id, ...req.body });
});

// 312. GET /finance/utilization
router.get('/finance/utilization', (req, res) => {
  return sendAdminSuccess(res, {
    totalAllocatedInr: 120000000,
    totalUtilizedInr: 84000000,
    utilizationPercentage: 70.0,
  });
});

// 313. GET /devices
router.get('/devices', async (req, res) => {
  try {
    const list = await Device.find().lean();
    const result = paginateArray(list, req.query.page, req.query.limit);
    return sendAdminSuccess(res, result.data, result.pagination);
  } catch (e) {
    return sendAdminError(res, 'DEVICES_ERROR', e.message);
  }
});

// 314. GET /devices/:id
router.get('/devices/:id', async (req, res) => {
  try {
    const d = await Device.findOne({ $or: [{ deviceId: req.params.id }, { serialNumber: req.params.id }] }).lean();
    return sendAdminSuccess(res, d || { deviceId: req.params.id, status: 'ONLINE' });
  } catch (e) {
    return sendAdminError(res, 'DEVICE_ERROR', e.message);
  }
});

// 315. POST /devices
router.post('/devices', async (req, res) => {
  try {
    const d = new Device(req.body);
    await d.save();
    await recordAdminAudit({ action: 'DEVICE_REGISTERED', entityType: 'DEVICE', entityId: d.deviceId, req });
    return sendAdminSuccess(res, d, null, 201);
  } catch (e) {
    return sendAdminError(res, 'DEVICE_CREATE_ERROR', e.message);
  }
});

// 316. PATCH /devices/:id
router.patch('/devices/:id', async (req, res) => {
  await recordAdminAudit({ action: 'DEVICE_UPDATED', entityType: 'DEVICE', entityId: req.params.id, req, newState: req.body });
  return sendAdminSuccess(res, { deviceId: req.params.id, ...req.body });
});

// 317. POST /devices/:id/bind
router.post('/devices/:id/bind', async (req, res) => {
  await Device.updateOne({ deviceId: req.params.id }, { $set: { instituteId: req.body.instituteId } });
  await recordAdminAudit({ action: 'DEVICE_BOUND_TO_INSTITUTE', entityType: 'DEVICE', entityId: req.params.id, req, newState: { instituteId: req.body.instituteId } });
  return sendAdminSuccess(res, { deviceId: req.params.id, instituteId: req.body.instituteId, bound: true });
});

// 318. POST /devices/:id/unbind
router.post('/devices/:id/unbind', async (req, res) => {
  await Device.updateOne({ deviceId: req.params.id }, { $set: { instituteId: null } });
  await recordAdminAudit({ action: 'DEVICE_UNBOUND', entityType: 'DEVICE', entityId: req.params.id, req });
  return sendAdminSuccess(res, { deviceId: req.params.id, bound: false });
});

// 319. GET /audit-logs
router.get('/audit-logs', async (req, res) => {
  try {
    const list = await AuditLog.find().sort({ createdAt: -1 }).lean();
    const result = paginateArray(list.length ? list : [
      { logId: 'AUD-001', actorName: 'Super Admin', action: 'PORTAL_BOOTSTRAP', entityType: 'SYSTEM', timestamp: new Date() }
    ], req.query.page, req.query.limit);
    return sendAdminSuccess(res, result.data, result.pagination);
  } catch (e) {
    return sendAdminError(res, 'AUDIT_LOGS_ERROR', e.message);
  }
});

// 320. GET /audit-logs/:id
router.get('/audit-logs/:id', async (req, res) => {
  try {
    const log = await AuditLog.findOne({ $or: [{ logId: req.params.id }, { _id: req.params.id }] }).lean();
    return sendAdminSuccess(res, log || { logId: req.params.id, action: 'VERIFIED' });
  } catch (e) {
    return sendAdminError(res, 'AUDIT_LOG_ERROR', e.message);
  }
});

// 321. GET /exports
router.get('/exports', (req, res) => {
  const exportsList = [
    { exportId: 'EXP-001', entity: 'TRAINEES', format: 'XLSX', status: 'COMPLETED', createdAt: new Date() },
  ];
  const r = paginateArray(exportsList, req.query.page, req.query.limit);
  return sendAdminSuccess(res, r.data, r.pagination);
});

// 322. POST /exports
router.post('/exports', async (req, res) => {
  await recordAdminAudit({ action: 'DATA_EXPORT_REQUESTED', entityType: 'EXPORT', entityId: 'EXP-NEW', req });
  return sendAdminSuccess(res, {
    exportId: `EXP-${Date.now().toString().slice(-4)}`,
    status: 'PROCESSING',
    format: req.body.format || 'XLSX',
    estimatedSeconds: 5,
  }, null, 202);
});

// 323. GET /exports/:exportId
router.get('/exports/:exportId', (req, res) => {
  return sendAdminSuccess(res, { exportId: req.params.exportId, status: 'COMPLETED', downloadUrl: `/api/v1/admin/exports/${req.params.exportId}/download` });
});

// 324. POST /exports/:exportId/cancel
router.post('/exports/:exportId/cancel', async (req, res) => {
  await recordAdminAudit({ action: 'DATA_EXPORT_CANCELLED', entityType: 'EXPORT', entityId: req.params.exportId, req });
  return sendAdminSuccess(res, { exportId: req.params.exportId, status: 'CANCELLED' });
});

// 325. GET /settings
router.get('/settings', (req, res) => {
  return sendAdminSuccess(res, {
    categories: ['PLATFORM', 'SECURITY', 'AUTHENTICATION', 'NOTIFICATIONS', 'LOCALIZATION', 'STORAGE', 'AI', 'ATTENDANCE', 'OFFLINE', 'CERTIFICATES', 'INTEGRATIONS'],
    platformName: 'PRAGYAAN National Cooperative Ecosystem',
    portalVersion: '2.4.0',
    maintenanceMode: false,
  });
});

// 326. GET /settings/:category
router.get('/settings/:category', (req, res) => {
  return sendAdminSuccess(res, {
    category: req.params.category.toUpperCase(),
    settings: { enabled: true, autoSyncIntervalMinutes: 15, loggingLevel: 'INFO' }
  });
});

// 327. PATCH /settings/:category
router.patch('/settings/:category', async (req, res) => {
  await recordAdminAudit({ action: 'SETTINGS_UPDATED', entityType: 'SETTINGS', entityId: req.params.category, req, newState: req.body });
  return sendAdminSuccess(res, { category: req.params.category.toUpperCase(), ...req.body, updatedAt: new Date() });
});

export default router;
