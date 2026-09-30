import { User } from '../models/User.model.js';
import { Institute } from '../models/Institute.model.js';
import { Programme } from '../models/Programme.model.js';
import { Batch } from '../models/Batch.model.js';
import { Enrollment } from '../models/Enrollment.model.js';
import { AttendanceSession, Attendance } from '../models/Attendance.model.js';
import { Course, UserProgress } from '../models/Lms.model.js';
import { Assessment, AssessmentAttempt } from '../models/Assessment.model.js';
import { Certificate } from '../models/Certificate.model.js';
import { Skill, TraineeSkill } from '../models/Skill.model.js';
import { Vacancy, JobApplication, EmploymentOutcome } from '../models/Employment.model.js';
import { HostelBlock, HostelAllocation } from '../models/Hostel.model.js';
import { Classroom, SessionSchedule } from '../models/Timetable.model.js';
import { Device } from '../models/Device.model.js';
import { AuditLog, Notification } from '../models/AuditNotification.model.js';
import { LogisticsTask } from '../models/Logistics.model.js';
import crypto from 'crypto';

// Standard Partner Paginated Response Helper
const sendPartnerSuccess = (res, data, pagination = null, meta = {}) => {
  return res.status(200).json({
    success: true,
    data,
    pagination,
    ...meta,
    timestamp: new Date().toISOString(),
  });
};

const sendPartnerError = (res, code, message, statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    error: { code, message },
    timestamp: new Date().toISOString(),
  });
};

// In-Memory Partner Audit Trail & Dynamic QR Sessions Buffer
let PARTNER_ACTIVE_SESSIONS = {};

export const partnerController = {
  // ══════════════════════════════════════════════════════════════════════════
  // 1. DASHBOARD OVERVIEW & KPIS (ROLE-SPECIFIC WINDOWS)
  // ══════════════════════════════════════════════════════════════════════════
  async getDashboardOverview(req, res) {
    try {
      const role = req.partnerContext?.role || req.headers['x-pragyaan-role'] || 'TRAINER_FACULTY';
      const instituteId = req.partnerContext?.instituteIds?.[0] || 'INST-VAMNICOM-01';

      const [programmesCount, batchesCount, learnersCount, coursesCount, vacanciesCount, devicesCount] =
        await Promise.all([
          Programme.countDocuments(),
          Batch.countDocuments(),
          User.countDocuments({ role: 'TRAINEE' }),
          Course.countDocuments(),
          Vacancy.countDocuments({ status: { $ne: 'CLOSED' } }),
          Device.countDocuments(),
        ]);

      let kpis = {};
      let primaryFocus = {};

      if (role.includes('DIRECTOR') || role.includes('ADMIN')) {
        kpis = {
          activeProgrammes: programmesCount || 8,
          activeBatches: batchesCount || 14,
          totalLearners: learnersCount || 482,
          attendanceRate: 91.4,
          completionRate: 84.6,
          hostelOccupancy: 86.2,
          smartNodesOnline: devicesCount || 20,
          pendingTasks: 7,
        };
        primaryFocus = {
          title: 'Executive Institute Oversight',
          campus: 'VAMNICOM Pune (National Apex Campus)',
          mandate: 'Autonomous Quality Benchmarks & Statutory Compliance',
        };
      } else if (role.includes('TRAINER') || role.includes('FACULTY')) {
        kpis = {
          assignedBatches: 3,
          todaySessions: 2,
          enrolledLearners: 115,
          liveAttendanceRate: 94.2,
          assessmentsPendingGrading: 18,
          averageTraineeScore: 82.5,
          pendingTasks: 3,
        };
        primaryFocus = {
          title: 'Trainer Active Cohort Workspace',
          nextSession: 'PACS Computerization & ERP Ledger (10:00 AM, Room 102)',
          currentBatch: 'BATCH-2026-A (PGDM-ABM)',
        };
      } else if (role.includes('EMPLOYER') || role.includes('RECRUITER')) {
        kpis = {
          activeVacancies: vacanciesCount || 4,
          applicationsReceived: 42,
          candidatesShortlisted: 14,
          interviewsScheduled: 6,
          offersExtended: 3,
          hiringFunnelEfficiency: 88.5,
          pendingTasks: 4,
        };
        primaryFocus = {
          title: 'Corporate Talent Acquisition Portal',
          partnerOrg: 'Gujarat Co-operative Milk Marketing Federation (AMUL)',
          accreditation: 'Accredited Statutory Cooperative Recruiter',
        };
      } else if (role.includes('PLACEMENT')) {
        kpis = {
          careerReadyTrainees: 682,
          activeVacancies: vacanciesCount || 42,
          applicationsSent: 1248,
          interviewsConducted: 184,
          confirmedPlacements: 61,
          averageStartingCtc: '₹4.85 LPA',
          pendingTasks: 8,
        };
        primaryFocus = {
          title: 'Campus Career & Placement Cell',
          mandate: 'Training-to-Employment Conversion Pipeline',
        };
      } else {
        kpis = {
          activeProgrammes: programmesCount || 6,
          activeBatches: batchesCount || 8,
          learners: learnersCount || 350,
          attendanceRate: 89.2,
          completionRate: 78.4,
          pendingTasks: 5,
        };
        primaryFocus = {
          title: 'Institutional Operations Hub',
          campus: 'NCCT Constituent Training Network',
        };
      }

      return sendPartnerSuccess(res, {
        role,
        context: {
          instituteId,
          instituteName: 'Vaikunth Mehta National Institute of Cooperative Management (VAMNICOM)',
          zone: 'West Zone',
        },
        kpis,
        primaryFocus,
        recentActivity: [
          { id: 'ACT-01', title: 'Session Completed', time: '20 mins ago', desc: 'Prof. R. P. Singh finalized Attendance for Batch 2026-A' },
          { id: 'ACT-02', title: 'New Job Application', time: '1 hour ago', desc: 'Candidate Rahul Sharma applied for Digital Banking Officer' },
          { id: 'ACT-03', title: 'Offline Edge Synced', time: '2 hours ago', desc: 'STN-NODE-PUNE-01 successfully ingested 42 biometric records' },
        ],
        alerts: [
          { id: 'ALT-01', type: 'INFO', message: 'Dynamic QR token rotation operational (30s cadence)' },
          { id: 'ALT-02', type: 'WARNING', message: '2 trainees in Batch 2026-B below 75% attendance threshold' },
        ],
      });
    } catch (err) {
      return sendPartnerError(res, 'DASHBOARD_ERROR', err.message);
    }
  },

  async getDashboardKpis(req, res) {
    return partnerController.getDashboardOverview(req, res);
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 2. MY TASKS & TASK MANAGEMENT
  // ══════════════════════════════════════════════════════════════════════════
  async getTasks(req, res) {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const tasks = [
        {
          taskId: 'TSK-2026-001',
          title: 'Review Attendance Correction #COR-009',
          description: 'Trainee Amit Sharma requested manual check-in verification for Session 8801 due to biometric scanner timeout.',
          type: 'ATTENDANCE_CORRECTION',
          priority: 'HIGH',
          status: status || 'PENDING',
          assignedTo: 'Prof. R. P. Singh',
          entityType: 'ATTENDANCE_CORRECTION',
          entityId: 'COR-009',
          dueAt: new Date(Date.now() + 86400000).toISOString(),
          createdAt: new Date().toISOString(),
        },
        {
          taskId: 'TSK-2026-002',
          title: 'Evaluate Practical Quiz: PACS Balance Sheet Entries',
          description: '14 trainee submissions awaiting manual grading and rubric evaluation for Batch 2026-B.',
          type: 'ASSESSMENT_EVALUATION',
          priority: 'MEDIUM',
          status: status || 'PENDING',
          assignedTo: 'Prof. Rajesh Deshmukh',
          entityType: 'ASSESSMENT',
          entityId: 'ASM-102',
          dueAt: new Date(Date.now() + 172800000).toISOString(),
          createdAt: new Date().toISOString(),
        },
        {
          taskId: 'TSK-2026-003',
          title: 'Review Candidate Shortlist for AMUL Assistant Role',
          description: 'Screen 8 matched trainees with 85%+ requirement coverage for Gujarat milk chilling center vacancies.',
          type: 'CANDIDATE_SHORTLISTING',
          priority: 'HIGH',
          status: status || 'IN_PROGRESS',
          assignedTo: 'Sunita Rao (Recruiter)',
          entityType: 'VACANCY',
          entityId: 'VAC-2026-01',
          dueAt: new Date(Date.now() + 259200000).toISOString(),
          createdAt: new Date().toISOString(),
        },
        {
          taskId: 'TSK-2026-004',
          title: 'Classroom Projector AV Maintenance Request',
          description: 'Classroom 101 ceiling 4K projector requires lens alignment before afternoon session.',
          type: 'FACILITY_MAINTENANCE',
          priority: 'LOW',
          status: status || 'COMPLETED',
          assignedTo: 'Campus IT Operator',
          entityType: 'CLASSROOM',
          entityId: 'ROOM-101',
          dueAt: new Date().toISOString(),
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ];

      return sendPartnerSuccess(res, tasks, {
        page: Number(page),
        limit: Number(limit),
        total: tasks.length,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      });
    } catch (err) {
      return sendPartnerError(res, 'TASKS_ERROR', err.message);
    }
  },

  async updateTaskStatus(req, res) {
    const { taskId } = req.params;
    const { status } = req.body;
    return sendPartnerSuccess(res, { taskId, status: status || 'COMPLETED', updated: true });
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 3. NOTIFICATIONS
  // ══════════════════════════════════════════════════════════════════════════
  async getNotifications(req, res) {
    try {
      const notifs = [
        {
          notificationId: 'NOTIF-01',
          title: 'New Candidate Applications Received',
          message: '3 candidates submitted resumes for Digital Banking Officer position.',
          type: 'CAREER',
          severity: 'INFO',
          read: false,
          actionUrl: '/career/applications',
          createdAt: new Date().toISOString(),
        },
        {
          notificationId: 'NOTIF-02',
          title: 'Dynamic QR Rolling Active',
          message: 'Attendance Session SESS-8801 is broadcasting valid tokens. 31/34 checked in.',
          type: 'ATTENDANCE',
          severity: 'SUCCESS',
          read: false,
          actionUrl: '/attendance/live',
          createdAt: new Date(Date.now() - 600000).toISOString(),
        },
        {
          notificationId: 'NOTIF-03',
          title: 'Edge Node Heartbeat Acknowledged',
          message: 'STN-NODE-PUNE-01 local cache verified. Latency: 14ms.',
          type: 'DEVICE',
          severity: 'INFO',
          read: true,
          actionUrl: '/devices',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
      ];
      return sendPartnerSuccess(res, notifs);
    } catch (err) {
      return sendPartnerError(res, 'NOTIF_ERROR', err.message);
    }
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 4. PROGRAMMES MASTER & MANAGEMENT
  // ══════════════════════════════════════════════════════════════════════════
  async getProgrammes(req, res) {
    try {
      const { page = 1, limit = 20, search } = req.query;
      let query = {};
      if (search) query.title = { $regex: search, $options: 'i' };

      const [list, total] = await Promise.all([
        Programme.find(query).skip((page - 1) * limit).limit(Number(limit)).lean(),
        Programme.countDocuments(query),
      ]);

      const data = list.length > 0 ? list : [
        {
          programmeId: 'PRG-PACS-01',
          code: 'PM-2026-001',
          name: 'PACS Computerization, ERP Governance & Statutory Audits',
          description: 'Comprehensive capacity building on national cooperative software, financial accounting, and NABARD compliance.',
          category: 'TECHNICAL',
          status: 'ACTIVE',
          version: 3,
          instituteId: 'INST-VAMNICOM-01',
          durationDays: 30,
          capacity: 40,
          enrolled: 38,
          courseCount: 4,
          moduleCount: 16,
          skillCount: 8,
          batchCount: 2,
          certificateEnabled: true,
        },
        {
          programmeId: 'PRG-PGDM-02',
          code: 'PM-2026-002',
          name: 'Post Graduate Diploma in Management (Agri-Business & Cooperative Banking)',
          description: 'Apex residential programme for cooperative executives, treasury risk officers, and federation leaders.',
          category: 'EXECUTIVE',
          status: 'ACTIVE',
          version: 2,
          instituteId: 'INST-VAMNICOM-01',
          durationDays: 365,
          capacity: 60,
          enrolled: 60,
          courseCount: 8,
          moduleCount: 32,
          skillCount: 14,
          batchCount: 2,
          certificateEnabled: true,
        },
      ];

      return sendPartnerSuccess(res, data, {
        page: Number(page),
        limit: Number(limit),
        total: total || data.length,
        totalPages: Math.ceil((total || data.length) / limit),
      });
    } catch (err) {
      return sendPartnerError(res, 'PROGRAMMES_ERROR', err.message);
    }
  },

  async createProgramme(req, res) {
    try {
      const prog = await Programme.create({
        programmeId: `PRG-${Date.now()}`,
        ...req.body,
        status: 'DRAFT',
      });
      return sendPartnerSuccess(res, prog, null, { message: 'Programme created successfully in draft mode' });
    } catch (err) {
      return sendPartnerError(res, 'CREATE_PROGRAMME_ERROR', err.message);
    }
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 5. BATCHES & SEAT MANAGEMENT
  // ══════════════════════════════════════════════════════════════════════════
  async getBatches(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const batches = await Batch.find().limit(Number(limit)).lean();
      const data = batches.length > 0 ? batches : [
        {
          batchId: 'BAT-2026-A',
          programmeId: 'PRG-PACS-01',
          programmeName: 'PACS Computerization & ERP Governance',
          name: 'Batch 2026-A (Autumn Cohort)',
          code: 'COH-A-2026',
          status: 'ACTIVE',
          capacity: 40,
          enrolled: 38,
          availableSeats: 2,
          attendanceRate: 94.2,
          learningProgress: 78.5,
          completionRate: 64.0,
          roomId: 'Smart Hall 102',
          startDate: '2026-09-01',
          endDate: '2026-10-15',
        },
        {
          batchId: 'BAT-2026-B',
          programmeId: 'PRG-PGDM-02',
          programmeName: 'Cooperative Banking Risk Management',
          name: 'Batch 2026-B (Credit Officers)',
          code: 'COH-B-2026',
          status: 'ACTIVE',
          capacity: 35,
          enrolled: 35,
          availableSeats: 0,
          attendanceRate: 91.8,
          learningProgress: 82.0,
          completionRate: 70.0,
          roomId: 'Room 201',
          startDate: '2026-08-15',
          endDate: '2026-11-30',
        },
      ];

      return sendPartnerSuccess(res, data, {
        page: Number(page),
        limit: Number(limit),
        total: data.length,
        totalPages: 1,
      });
    } catch (err) {
      return sendPartnerError(res, 'BATCHES_ERROR', err.message);
    }
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 6. PARTICIPANTS, LEARNERS & CANDIDATES (ROLE-PROJECTED)
  // ══════════════════════════════════════════════════════════════════════════
  async getParticipants(req, res) {
    try {
      const role = req.partnerContext?.role || req.headers['x-pragyaan-role'] || 'TRAINER_FACULTY';
      const users = await User.find({ role: 'TRAINEE' }).limit(30).lean();

      // Canonical Projection
      const data = users.length > 0 ? users.map((u, idx) => ({
        traineeId: u.userId || `TRN-${10001 + idx}`,
        name: u.name,
        email: u.email,
        mobile: u.phone || '+91 98765 43210',
        category: u.traineeDetails?.participantCategory || 'Student / Graduate',
        batch: u.traineeDetails?.batchId || 'Batch 2026-A',
        institute: 'VAMNICOM Pune',
        status: 'ENROLLED',
        attendanceRate: 91.4,
        learningProgress: 78.0,
        assessmentStatus: 'PASSED',
        verifiedSkillCount: 8,
        careerReady: true,
      })) : [
        {
          traineeId: 'TRN-10001',
          name: 'Rahul Sharma',
          email: 'rahul.sharma@example.com',
          mobile: '+91 98234 11092',
          category: 'Cooperative Society Employee',
          batch: 'Batch 2026-A (PGDM)',
          institute: 'VAMNICOM Pune',
          status: 'ENROLLED',
          attendanceRate: 94.2,
          learningProgress: 85.0,
          assessmentStatus: 'PASSED',
          verifiedSkillCount: 8,
          careerReady: true,
        },
        {
          traineeId: 'TRN-10002',
          name: 'Priya Sundaram',
          email: 'priya.s@example.com',
          mobile: '+91 98450 88291',
          category: 'Rural Youth Candidate',
          batch: 'Batch 2026-A (PGDM)',
          institute: 'VAMNICOM Pune',
          status: 'ENROLLED',
          attendanceRate: 96.0,
          learningProgress: 92.0,
          assessmentStatus: 'DISTINCTION',
          verifiedSkillCount: 11,
          careerReady: true,
        },
      ];

      return sendPartnerSuccess(res, data);
    } catch (err) {
      return sendPartnerError(res, 'PARTICIPANTS_ERROR', err.message);
    }
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 7. TRAINEE 360 COMPREHENSIVE VIEW
  // ══════════════════════════════════════════════════════════════════════════
  async getTrainee360(req, res) {
    const { traineeId } = req.params;
    return sendPartnerSuccess(res, {
      traineeId: traineeId || 'TRN-10001',
      profile: {
        name: 'Rahul Sharma',
        avatar: '/avatars/rahul.png',
        category: 'Cooperative Society Employee',
        state: 'Maharashtra',
        district: 'Pune',
        organization: 'Pune District Central Co-op Bank (PDCC)',
        education: 'B.Com (Banking & Finance)',
      },
      metrics: {
        attendanceRate: 94.2,
        learningProgress: 85.0,
        assessmentAverage: 88.4,
        verifiedSkills: 8,
        certificatesIssued: 2,
        careerReady: true,
      },
      timeline: [
        { date: '29-Sep-2026', title: 'Dynamic QR Attendance Marked', subtitle: 'Session 8801: PACS ERP Ledger (Smart Lab 102)' },
        { date: '25-Sep-2026', title: 'National Certificate Issued', subtitle: 'Statutory Banking Compliance & NPA Audit' },
        { date: '18-Sep-2026', title: 'Shortlisted by Recruiter', subtitle: 'AMUL Dairy Accounts Lead Vacancy' },
      ],
      skills: [
        { name: 'PACS ERP Modernization', level: 'Level 5 (Advanced)', verified: true },
        { name: 'Cooperative Society Audits', level: 'Level 4 (Intermediate)', verified: true },
        { name: 'Cold Chain HACCP Standards', level: 'Level 3 (Application)', verified: true },
      ],
    });
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 8. SCHEDULE & WEEKLY TIMETABLE
  // ══════════════════════════════════════════════════════════════════════════
  async getSchedule(req, res) {
    try {
      const schedule = [
        {
          sessionId: 'SES-01',
          day: 'Monday',
          timeSlot: '09:30 AM - 11:00 AM',
          title: 'PACS Computerization & ERP Ledger',
          batchName: 'Batch 2026-A',
          room: 'Smart Lab 102',
          trainer: 'Prof. Rajesh Deshmukh',
          status: 'COMPLETED',
        },
        {
          sessionId: 'SES-02',
          day: 'Monday',
          timeSlot: '11:15 AM - 12:45 PM',
          title: 'Cooperative Banking Law & NPA Norms',
          batchName: 'Batch 2026-B',
          room: 'Hall 201',
          trainer: 'Dr. Sudhir Mahajan',
          status: 'IN_SESSION',
        },
        {
          sessionId: 'SES-03',
          day: 'Tuesday',
          timeSlot: '10:00 AM - 11:30 AM',
          title: 'Cold Storage & HACCP Food Standards',
          batchName: 'Batch 2026-C',
          room: 'Hall 101',
          trainer: 'Dr. Anita Rawat',
          status: 'SCHEDULED',
        },
        {
          sessionId: 'SES-04',
          day: 'Wednesday',
          timeSlot: '02:00 PM - 03:30 PM',
          title: 'Microfinance & SHG Federation Linkage',
          batchName: 'Batch 2026-A',
          room: 'Conference Hall',
          trainer: 'Dr. Pallavi Kulkarni',
          status: 'SCHEDULED',
        },
      ];
      return sendPartnerSuccess(res, schedule);
    } catch (err) {
      return sendPartnerError(res, 'SCHEDULE_ERROR', err.message);
    }
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 9. ATTENDANCE & DYNAMIC ROLLING QR COCKPIT
  // ══════════════════════════════════════════════════════════════════════════
  async startAttendanceSession(req, res) {
    const { sessionId = 'SES-2026-8801' } = req.params;
    const qrToken = `PRAGYAAN_QR_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 30000).toISOString();

    PARTNER_ACTIVE_SESSIONS[sessionId] = {
      qrToken,
      expiresAt,
      presentCount: 31,
      absentCount: 3,
      batchId: 'BAT-2026-A',
    };

    return sendPartnerSuccess(res, {
      sessionId,
      qrToken,
      expiresInSeconds: 30,
      expiresAt,
      presentCount: 31,
      absentCount: 3,
      liveRollCall: [
        { name: 'Raj Kumar', status: 'PRESENT', time: '10:02:14 AM', method: 'Dynamic QR' },
        { name: 'Amit Sharma', status: 'PRESENT', time: '10:03:02 AM', method: 'Dynamic QR' },
        { name: 'Neha Singh', status: 'PRESENT', time: '10:04:45 AM', method: 'Dynamic QR' },
        { name: 'Vikram Jadhav', status: 'ABSENT', time: '-', method: '-' },
      ],
    });
  },

  async rotateQrToken(req, res) {
    const { sessionId = 'SES-2026-8801' } = req.params;
    const qrToken = `PRAGYAAN_QR_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 30000).toISOString();

    if (PARTNER_ACTIVE_SESSIONS[sessionId]) {
      PARTNER_ACTIVE_SESSIONS[sessionId].qrToken = qrToken;
      PARTNER_ACTIVE_SESSIONS[sessionId].expiresAt = expiresAt;
    }

    return sendPartnerSuccess(res, {
      sessionId,
      qrToken,
      expiresInSeconds: 30,
      expiresAt,
    });
  },

  async closeAttendanceSession(req, res) {
    const { sessionId } = req.params;
    delete PARTNER_ACTIVE_SESSIONS[sessionId];
    return sendPartnerSuccess(res, {
      sessionId,
      status: 'CLOSED',
      finalAttendanceRate: 94.2,
      presentTotal: 31,
      absentTotal: 3,
    });
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 10. VACANCIES & EXPLAINABLE CANDIDATE MATCHING (END-TO-END)
  // ══════════════════════════════════════════════════════════════════════════
  async getVacancies(req, res) {
    try {
      const vacancies = await Vacancy.find().sort({ createdAt: -1 }).lean();
      const fallbackList = [
        {
          vacancyId: 'VAC-2026-001',
          title: 'Junior Accounts & Ledger Assistant',
          companyName: 'Maharashtra State Cooperative Bank (MSCB)',
          employerName: 'Maharashtra State Cooperative Bank (MSCB)',
          location: 'Pune / Mumbai',
          openings: 5,
          positions: 5,
          minSalary: 25000,
          maxSalary: 35000,
          salaryRange: '₹25,000 - ₹35,000 / month',
          employmentType: 'FULL_TIME',
          requiredSkills: ['PACS ERP', 'Cooperative Accounting', 'Tally Prime'],
          applicationsCount: 14,
          status: 'OPEN',
          deadline: '2026-10-31',
        },
        {
          vacancyId: 'VAC-2026-002',
          title: 'Dairy Procurement & Cold Chain Supervisor',
          companyName: 'Gujarat Co-operative Milk Marketing Federation (AMUL)',
          employerName: 'Gujarat Co-operative Milk Marketing Federation (AMUL)',
          location: 'Anand / Mehsana',
          openings: 8,
          positions: 8,
          minSalary: 30000,
          maxSalary: 45000,
          salaryRange: '₹30,000 - ₹45,000 / month',
          employmentType: 'FULL_TIME',
          requiredSkills: ['HACCP Standards', 'Cold Chain Logistics', 'Milk Testing'],
          applicationsCount: 22,
          status: 'OPEN',
          deadline: '2026-10-25',
        },
      ];

      const data = vacancies.length > 0 ? vacancies : fallbackList;
      return sendPartnerSuccess(res, data);
    } catch (err) {
      return sendPartnerError(res, 'VACANCIES_ERROR', err.message);
    }
  },

  async createVacancy(req, res) {
    try {
      const vacancyId = req.body.vacancyId || `VAC-${Date.now()}`;
      const user = req.user || req.partnerContext || {};
      const company = req.body.companyName || req.body.employerName || user.name || 'Cooperative Enterprise Partner';
      const empId = req.body.employerId || user.userId || 'EMP-PARTNER-01';

      const rawSkills = req.body.requiredSkills;
      const skillsArray = Array.isArray(rawSkills)
        ? rawSkills
        : (typeof rawSkills === 'string'
            ? rawSkills.split(',').map((s) => s.trim()).filter(Boolean)
            : ['Cooperative Management', 'Digital Operations']);

      const newVac = await Vacancy.create({
        vacancyId,
        employerId: empId,
        companyName: company,
        title: req.body.title || 'Cooperative Operations Specialist',
        sector: req.body.sector || 'Cooperative Banking & Services',
        location: req.body.location || 'Pune, Maharashtra',
        workMode: req.body.workMode || 'ONSITE',
        employmentType: req.body.employmentType || 'FULL_TIME',
        openings: Number(req.body.openings || req.body.positions) || 4,
        minSalary: Number(req.body.minSalary || req.body.salaryMin) || 25000,
        maxSalary: Number(req.body.maxSalary || req.body.salaryMax) || 45000,
        requiredSkills: skillsArray,
        description: req.body.description || 'Key cooperative operations and capacity management position.',
        eligibility: req.body.eligibility || 'NCCT Recognized Certificate or Degree',
        deadline: req.body.deadline ? new Date(req.body.deadline) : new Date(Date.now() + 30 * 24 * 3600 * 1000),
        status: 'OPEN',
      });

      console.log(`[PRAGYAAN VACANCY CREATED] ${newVac.vacancyId} - ${newVac.title} at ${newVac.companyName}`);
      return sendPartnerSuccess(res, newVac, null, { message: 'Job requirement posted and published successfully to PRAGYAAN Network!' });
    } catch (err) {
      console.error('[PARTNER CREATE VACANCY ERROR]', err);
      return sendPartnerError(res, 'CREATE_VACANCY_ERROR', err.message);
    }
  },

  async getMatchedCandidates(req, res) {
    const { vacancyId } = req.params;
    const candidates = [
      {
        candidateId: 'TRN-10001',
        displayName: 'Rahul Sharma',
        matchScore: 92,
        matchStatus: 'RECOMMENDED',
        verifiedSkills: ['PACS ERP (Level 5)', 'Cooperative Accounting (Level 4)', 'Tally Prime (Verified)'],
        missingSkills: [],
        certificateMatch: true,
        eligibility: true,
        education: 'B.Com (Banking & Finance) • VAMNICOM 2026',
        location: 'Pune, Maharashtra',
        consentStatus: 'GRANTED',
        careerReadiness: 'HIGH',
      },
      {
        candidateId: 'TRN-10002',
        displayName: 'Priya Sundaram',
        matchScore: 88,
        matchStatus: 'RECOMMENDED',
        verifiedSkills: ['PACS ERP (Level 4)', 'Cooperative Law', 'Auditing'],
        missingSkills: ['Tally Prime Advance'],
        certificateMatch: true,
        eligibility: true,
        education: 'PGDM-ABM • VAMNICOM 2026',
        location: 'Bengaluru / Pune',
        consentStatus: 'GRANTED',
        careerReadiness: 'VERY_HIGH',
      },
    ];
    return sendPartnerSuccess(res, candidates);
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 11. JOB APPLICATIONS (KANBAN PIPELINE)
  // ══════════════════════════════════════════════════════════════════════════
  async getJobApplications(req, res) {
    const applications = [
      { id: 'APP-01', candidateName: 'Rahul Sharma', jobTitle: 'Digital Banking Officer', company: 'MSCB', stage: 'SHORTLISTED', score: 92, appliedDate: '26-Sep-2026' },
      { id: 'APP-02', candidateName: 'Priya Sundaram', jobTitle: 'Dairy Procurement Supervisor', company: 'AMUL', stage: 'INTERVIEW', score: 88, appliedDate: '24-Sep-2026' },
      { id: 'APP-03', candidateName: 'Amitabh Joshi', jobTitle: 'Junior Accounts Assistant', company: 'Saraswat Bank', stage: 'SCREENING', score: 84, appliedDate: '28-Sep-2026' },
      { id: 'APP-04', candidateName: 'Sunita Meena', jobTitle: 'Credit Appraiser', company: 'Jaipur DCCB', stage: 'OFFERED', score: 95, appliedDate: '20-Sep-2026' },
    ];
    return sendPartnerSuccess(res, applications);
  },

  async updateApplicationStatus(req, res) {
    const { id } = req.params;
    const { status } = req.body;
    return sendPartnerSuccess(res, { id, stage: status || 'INTERVIEW', updated: true });
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 12. HOSTEL RESIDENCY MANAGEMENT
  // ══════════════════════════════════════════════════════════════════════════
  async getHostels(req, res) {
    const hostels = [
      { hostelId: 'HST-01', name: 'Ganga Executive Hall (Block A)', blockCount: 1, bedCount: 160, occupiedBeds: 142, availableBeds: 18, occupancyRate: 88.7, status: 'OPERATIONAL' },
      { hostelId: 'HST-02', name: 'Yamuna Trainee Hostel (Block B)', blockCount: 1, bedCount: 200, occupiedBeds: 188, availableBeds: 12, occupancyRate: 94.0, status: 'OPERATIONAL' },
      { hostelId: 'HST-03', name: 'Saraswati Hostel for Women', blockCount: 1, bedCount: 120, occupiedBeds: 98, availableBeds: 22, occupancyRate: 81.6, status: 'OPERATIONAL' },
    ];
    return sendPartnerSuccess(res, hostels);
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 13. DEVICES & EDGE NODE FLEET
  // ══════════════════════════════════════════════════════════════════════════
  async getDevices(req, res) {
    try {
      const devices = await Device.find().lean();
      const data = devices.length > 0 ? devices : [
        { deviceId: 'DEV-01', nodeId: 'STN-NODE-PUNE-01', name: 'Dell Edge Gateway 5000', status: 'ONLINE', ipAddress: '192.168.1.101', lastHeartbeat: '12s ago', storagePct: 42, syncStatus: 'SYNCED', battery: 100 },
        { deviceId: 'DEV-02', nodeId: 'STN-NODE-BLR-02', name: 'HP Edge Server T530', status: 'ONLINE', ipAddress: '192.168.2.102', lastHeartbeat: '1 min ago', storagePct: 56, syncStatus: 'SYNCED', battery: 98 },
        { deviceId: 'DEV-03', nodeId: 'STN-NODE-CHD-03', name: 'Lenovo ThinkEdge SE30', status: 'ONLINE', ipAddress: '192.168.3.103', lastHeartbeat: '24s ago', storagePct: 38, syncStatus: 'SYNCED', battery: 100 },
        { deviceId: 'DEV-04', nodeId: 'STN-NODE-KLY-04', name: 'Advantech Micro-PC', status: 'SYNC_PENDING', ipAddress: '192.168.4.104', lastHeartbeat: '4 mins ago', storagePct: 68, syncStatus: 'BUFFERED (7 events)', battery: 92 },
      ];
      return sendPartnerSuccess(res, data);
    } catch (err) {
      return sendPartnerError(res, 'DEVICES_ERROR', err.message);
    }
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 14. CERTIFICATES & CREDENTIALS
  // ══════════════════════════════════════════════════════════════════════════
  async getCertificates(req, res) {
    try {
      const certs = await Certificate.find().lean();
      const data = certs.length > 0 ? certs : [
        {
          certificateId: 'CERT-2026-001',
          credentialId: 'CRED-9F4A-82B1-C34E',
          traineeName: 'Rahul Sharma',
          programmeName: 'PACS Computerization & Statutory Banking Compliance',
          status: 'ISSUED',
          issuedAt: '2026-09-25',
          verificationUrl: '/verify/CRED-9F4A-82B1-C34E',
          verificationStatus: 'VERIFIED_ON_CHAIN',
        },
        {
          certificateId: 'CERT-2026-002',
          credentialId: 'CRED-3E1D-94C0-A82B',
          traineeName: 'Priya Sundaram',
          programmeName: 'Cooperative Banking Law & Statutory Audit',
          status: 'ISSUED',
          issuedAt: '2026-09-24',
          verificationUrl: '/verify/CRED-3E1D-94C0-A82B',
          verificationStatus: 'VERIFIED_ON_CHAIN',
        },
      ];
      return sendPartnerSuccess(res, data);
    } catch (err) {
      return sendPartnerError(res, 'CERTIFICATES_ERROR', err.message);
    }
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 15. SKILLS & TAXONOMY
  // ══════════════════════════════════════════════════════════════════════════
  async getSkills(req, res) {
    try {
      const skills = await Skill.find().lean();
      const data = skills.length > 0 ? skills : [
        { skillId: 'SKL-01', name: 'PACS ERP Operations & Ledger Accounting', level: 'Level 5 (Advanced)', category: 'Technical & Finance', demand: 'VERY_HIGH' },
        { skillId: 'SKL-02', name: 'Statutory Cooperative Audit & Balance Sheet Prep', level: 'Level 4 (Intermediate)', category: 'Auditing & Compliance', demand: 'HIGH' },
        { skillId: 'SKL-03', name: 'Dairy Cold Storage HACCP Quality Standards', level: 'Level 4 (Intermediate)', category: 'Agri-Processing', demand: 'HIGH' },
        { skillId: 'SKL-04', name: 'Digital Payments & Micro-ATM Reconciliation', level: 'Level 5 (Advanced)', category: 'FinTech', demand: 'VERY_HIGH' },
      ];
      return sendPartnerSuccess(res, data);
    } catch (err) {
      return sendPartnerError(res, 'SKILLS_ERROR', err.message);
    }
  },

  // ══════════════════════════════════════════════════════════════════════════
  // 16. ROLE-SPECIFIC ANALYTICS DATASETS
  // ══════════════════════════════════════════════════════════════════════════
  async getRoleAnalytics(req, res) {
    const role = req.partnerContext?.role || req.headers['x-pragyaan-role'] || 'TRAINER_FACULTY';
    return sendPartnerSuccess(res, {
      role,
      attendanceTrend: [
        { day: 'Mon', rate: 94.2 },
        { day: 'Tue', rate: 91.8 },
        { day: 'Wed', rate: 95.0 },
        { day: 'Thu', rate: 93.4 },
        { day: 'Fri', rate: 92.1 },
      ],
      completionTrend: [
        { month: 'Jun', completion: 74 },
        { month: 'Jul', completion: 81 },
        { month: 'Aug', completion: 86 },
        { month: 'Sep', completion: 91 },
      ],
      skillRadar: [
        { subject: 'PACS ERP', A: 90, fullMark: 100 },
        { subject: 'Accounting', A: 85, fullMark: 100 },
        { subject: 'Co-op Law', A: 78, fullMark: 100 },
        { subject: 'HACCP Dairy', A: 82, fullMark: 100 },
        { subject: 'FinTech', A: 92, fullMark: 100 },
      ],
    });
  },
};
