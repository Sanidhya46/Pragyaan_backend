import { User } from '../models/User.model.js';
import { Programme } from '../models/Programme.model.js';
import { Batch } from '../models/Batch.model.js';
import { Enrollment } from '../models/Enrollment.model.js';
import { Course, UserProgress } from '../models/Lms.model.js';
import { Attendance, AttendanceSession } from '../models/Attendance.model.js';
import { Assessment, AssessmentAttempt } from '../models/Assessment.model.js';
import { Certificate } from '../models/Certificate.model.js';
import { Skill, TraineeSkill } from '../models/Skill.model.js';
import { Vacancy, JobApplication, EmploymentOutcome } from '../models/Employment.model.js';
import {
  TraineeGamification,
  SkillTreeNode,
  CooperativeSquad,
  GamifiedAssessment,
} from '../models/Gamification.model.js';
import { Notification } from '../models/AuditNotification.model.js';
import { SyncOperation } from '../models/SyncOperation.model.js';
import crypto from 'crypto';

// Standard Learner API Response Helpers
const sendSuccess = (res, data, pagination = null, meta = {}) => {
  return res.status(200).json({
    success: true,
    data,
    ...(pagination ? { pagination } : {}),
    ...meta,
    timestamp: new Date().toISOString(),
  });
};

const sendError = (res, code, message, statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    error: { code, message },
    timestamp: new Date().toISOString(),
  });
};

// In-Memory Buffers for Real-Time Community, Challenges, Streaks & Offline Outbox
let CURRENT_USER_STREAK = 7;
let CURRENT_USER_XP = 1250;
let CURRENT_USER_BADGES = 8;
let CURRENT_USER_CHALLENGES = 5;
let COMMUNITY_QUESTIONS_BUFFER = [
  {
    questionId: 'Q-COMM-101',
    authorId: 'TR-DEMO-001',
    authorName: 'Rahul Sharma',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    title: 'How does PACS computerized ledger sync during power outage?',
    description: 'Our cooperative has frequent grid failures in rural Jhansi. Does Edge STN keep transaction checksums locally before Central server sync?',
    category: 'PACS Accounting & Edge Tech',
    programmeId: 'PROG-COOP-01',
    tags: ['PACS', 'EdgeSTN', 'OfflineSync', 'Accounting'],
    views: 142,
    upvotes: 28,
    answersCount: 3,
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    answers: [
      {
        answerId: 'ANS-901',
        authorId: 'FAC-PUNE-01',
        authorName: 'Prof. R. P. Singh (VAMNICOM)',
        content: 'Yes! Edge STN operates on an idempotent SQLite Outbox. Every entry is hashed with SHA-256 and queued until connectivity returns, guaranteeing zero duplicate ledger entries.',
        upvotes: 19,
        accepted: true,
        createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
      },
      {
        answerId: 'ANS-902',
        authorId: 'TR-PUNE-004',
        authorName: 'Pooja Verma',
        content: 'We tested this in our computer lab yesterday — the sync happened automatically within 4 seconds of reconnecting!',
        upvotes: 7,
        accepted: false,
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
    ],
  },
  {
    questionId: 'Q-COMM-102',
    authorId: 'TR-LKO-002',
    authorName: 'Ananya Patel',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
    title: 'Statutory compliance differences between State Cooperative Societies Act vs MSCS Act 2002?',
    description: 'Preparing for the Cooperative Governance exam next Monday. Need clarification on board member tenure limits.',
    category: 'Cooperative Governance',
    programmeId: 'PROG-GOV-02',
    tags: ['MSCSAct', 'Governance', 'ExamPrep'],
    views: 98,
    upvotes: 16,
    answersCount: 1,
    status: 'ACTIVE',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    answers: [
      {
        answerId: 'ANS-903',
        authorId: 'FAC-LKO-02',
        authorName: 'Dr. Sunita Rao (ICM Lucknow)',
        content: 'Under Multi-State Cooperative Societies Act 2002, the board tenure is fixed at 5 years with mandatory democratic election audits overseen by the Cooperative Election Authority.',
        upvotes: 14,
        accepted: true,
        createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
      },
    ],
  },
];

let COMMUNITY_CHALLENGES_BUFFER = [
  {
    challengeId: 'CHAL-FOOD-01',
    creatorId: 'TR-DEMO-001',
    creatorName: 'Rahul Sharma',
    title: 'Food Safety & Microbial Hazard Control Challenge',
    question: 'Which international standard and procedural method is mandatory for controlling biological hazards in dairy processing?',
    options: [
      { id: 'A', text: 'HACCP (Hazard Analysis Critical Control Point)' },
      { id: 'B', text: 'FIFO (First In First Out Inventory)' },
      { id: 'C', text: 'Double-Entry PACS Ledger' },
      { id: 'D', text: 'Cold Chain Route Logistics' },
    ],
    correctOption: 'A',
    explanation: 'HACCP is the global preventive framework ensuring microbiological safety across dairy, food processing, and storage lines.',
    timeLimitSeconds: 30,
    pointsReward: 20,
    category: 'Dairy Tech & Food Safety',
    difficulty: 'Medium',
    participantsCount: 84,
    successRate: 91.2,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
  {
    challengeId: 'CHAL-FIN-02',
    creatorId: 'TR-PUNE-004',
    creatorName: 'Pooja Verma',
    title: 'PACS Digital Accounting Quickfire',
    question: 'Under standard RBI PACS guidelines, how are Kisan Credit Card (KCC) short-term crop loans classified for NPA recognition?',
    options: [
      { id: 'A', text: 'Overdue beyond 2 crop seasons for short duration crops' },
      { id: 'B', text: 'Overdue beyond 30 days of harvest' },
      { id: 'C', text: 'Overdue beyond 1 year irrespective of crop cycle' },
      { id: 'D', text: 'Immediate write-off at quarter end' },
    ],
    correctOption: 'A',
    explanation: 'Short duration crops are classified as NPA if the installment of principal or interest remains unpaid for two crop seasons.',
    timeLimitSeconds: 30,
    pointsReward: 25,
    category: 'Digital Finance',
    difficulty: 'Advanced',
    participantsCount: 112,
    successRate: 78.4,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
];

let ACTIVE_CHALLENGE_ATTEMPTS = {};

export const learnerController = {
  // ══════════════════════════════════════════════════════════════════════════
  // DOMAIN 01 — AUTHENTICATION & SESSION (9 APIs)
  // ══════════════════════════════════════════════════════════════════════════
  async register(req, res) {
    try {
      const { firstName, lastName, mobile, email, password, participantCategory, state } = req.body;
      const traineeId = `TR-${Date.now().toString().slice(-6)}`;
      return sendSuccess(res, {
        traineeId,
        name: `${firstName || 'New'} ${lastName || 'Trainee'}`.trim(),
        mobile,
        email,
        participantCategory: participantCategory || 'RURAL_YOUTH',
        state: state || 'Uttar Pradesh',
        status: 'VERIFICATION_PENDING',
        message: 'Registration initiated. OTP sent to mobile.',
      });
    } catch (e) {
      return sendError(res, 'REGISTRATION_FAILED', e.message);
    }
  },

  async login(req, res) {
    try {
      const { identifier } = req.body;
      const user = await User.findOne({ email: identifier }) || {
        userId: 'USER-TR-001',
        name: 'Rahul Sharma',
        email: identifier || 'rahul.sharma@pragyaan.gov.in',
        role: 'TRAINEE',
        mobile: '+91 98765 43210',
      };
      return sendSuccess(res, {
        accessToken: `PRAGYAAN_JWT_LEARNER_${Buffer.from(user.email).toString('base64')}`,
        user: {
          traineeId: 'TR-DEMO-001',
          name: user.name || 'Rahul Sharma',
          email: user.email,
          role: 'TRAINEE',
          instituteId: 'INST-VAMNICOM-01',
          instituteName: 'VAMNICOM, Pune',
          centerLocation: 'Jhansi, Uttar Pradesh',
          profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        },
      });
    } catch (e) {
      return sendError(res, 'LOGIN_FAILED', e.message);
    }
  },

  async verifyOtp(req, res) {
    return sendSuccess(res, { verified: true, message: 'OTP verified successfully.' });
  },

  async resendOtp(req, res) {
    return sendSuccess(res, { sent: true, retryAfterSeconds: 60 });
  },

  async refreshToken(req, res) {
    return sendSuccess(res, { accessToken: `PRAGYAAN_JWT_REFRESHED_${Date.now()}` });
  },

  async logout(req, res) {
    return sendSuccess(res, { loggedOut: true });
  },

  async forgotPassword(req, res) {
    return sendSuccess(res, { resetTokenSent: true, channel: 'EMAIL_AND_SMS' });
  },

  async resetPassword(req, res) {
    return sendSuccess(res, { passwordUpdated: true });
  },

  async getSession(req, res) {
    return sendSuccess(res, {
      active: true,
      traineeId: req.headers['x-pragyaan-trainee-id'] || 'TR-DEMO-001',
      cipher: 'TLS_AES_256_GCM_SHA384',
      edgeNodeSync: 'ONLINE',
      ip: req.ip || '127.0.0.1',
    });
  },

  // ══════════════════════════════════════════════════════════════════════════
  // DOMAIN 02 — LEARNER PROFILE (7 APIs)
  // ══════════════════════════════════════════════════════════════════════════
  async getProfile(req, res) {
    return sendSuccess(res, {
      traineeId: 'TR-DEMO-001',
      name: 'Rahul Sharma',
      fullName: 'Rahul Dev Sharma',
      gender: 'Male',
      dateOfBirth: '2001-08-14',
      email: 'rahul.sharma@pragyaan.gov.in',
      mobile: '+91 98765 43210',
      address: 'House 42, Civil Lines, Jhansi',
      district: 'Jhansi',
      state: 'Uttar Pradesh',
      pincode: '284001',
      participantCategory: 'PACS Executive / Rural Cooperative Youth',
      enrolledInstitute: 'Institute of Cooperative Management (ICM), Jhansi / VAMNICOM Pune',
      profileCompletion: 88,
      profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      preferredLanguage: 'Hindi / English (Bilingual)',
      nsqfLevelTarget: 'Level 5 (Cooperative Business & Financial Accounting)',
    });
  },

  async updateProfile(req, res) {
    return sendSuccess(res, { updated: true, profile: { ...req.body, updatedAt: new Date() } });
  },

  async getEducation(req, res) {
    return sendSuccess(res, [
      { id: 'EDU-1', qualification: 'B.Com (Banking & Finance)', institution: 'Bundelkhand University, Jhansi', year: 2024, grade: 'First Division' },
      { id: 'EDU-2', qualification: 'Higher Secondary (10+2 Commerce)', institution: 'Govt. Inter College Jhansi', year: 2021, grade: '82%' },
    ]);
  },

  async addEducation(req, res) {
    return sendSuccess(res, { id: `EDU-${Date.now()}`, ...req.body }, null, { created: true });
  },

  async updateEducation(req, res) {
    return sendSuccess(res, { id: req.params.id, ...req.body, updated: true });
  },

  async deleteEducation(req, res) {
    return sendSuccess(res, { id: req.params.id, deleted: true });
  },

  async getProfileCompletion(req, res) {
    return sendSuccess(res, {
      percentage: 88,
      completedSteps: ['Personal Information', 'Contact Details', 'Education Records', 'Category Verification', 'Aadhaar eKYC'],
      missingSteps: ['Resume Document Upload', 'Career Target Preferences'],
    });
  },

  // ══════════════════════════════════════════════════════════════════════════
  // DOMAIN 03 — LEARNER HOME & DASHBOARD (IMAGE 1 AGGREGATION) (5 APIs)
  // ══════════════════════════════════════════════════════════════════════════
  async getDashboard(req, res) {
    return sendSuccess(res, {
      location: 'Jhansi, Uttar Pradesh',
      unreadNotifications: 3,
      user: {
        name: 'Rahul Sharma',
        role: 'TRAINEE',
        institute: 'ICM, Jhansi / VAMNICOM',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      },
      actionTiles: [
        { id: 'programmes', title: 'Programmes', subtitle: 'Discover • Apply', icon: 'Mortarboard', gradient: 'blue' },
        { id: 'attendance', title: 'Scan Attendance', subtitle: 'QR / Face', icon: 'QrCode', gradient: 'green' },
        { id: 'offline', title: 'Offline Learning', subtitle: 'Downloaded Courses', icon: 'CloudDownload', gradient: 'purple' },
        { id: 'ai', title: 'Ask PRAGYAAN AI', subtitle: 'Learn • Skills • Career', icon: 'Bot', gradient: 'rose' },
      ],
      heroBanner: {
        title: 'Build Skills. Open Opportunities.',
        subtitle: 'Your learning journey to a better future starts here.',
        ctaText: 'Continue Learning',
        badgeText: 'Learn Grow Achieve',
        imageAsset: '/pragyaan_learner_banner.png',
      },
      todayLearning: {
        courseId: 'CRS-101',
        title: 'Cooperative Accounting & Digital Finance',
        module: 'Module 3 of 6',
        progressPercentage: 45,
        remainingTime: '1h 20m left',
        thumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&auto=format&fit=crop&q=80',
      },
      todayTraining: {
        time: '10:30 AM - 12:00 PM',
        title: 'Digital Finance Workshop',
        location: 'ICM, Jhansi • Room 203',
        status: 'Attendance Pending',
        qrStatus: 'ACTIVE',
      },
      recommendedProgrammes: [
        {
          id: 'PROG-01',
          title: 'Cooperative Management',
          badge: 'Popular',
          institute: 'NCCT ICM, Lucknow',
          duration: '6 Months',
          languages: 'Hindi / English',
          certification: true,
          mode: 'Offline + Online',
          thumbnail: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&auto=format&fit=crop&q=80',
        },
        {
          id: 'PROG-02',
          title: 'Digital Literacy',
          badge: 'New',
          institute: 'VAMNICOM, Pune',
          duration: '3 Months',
          languages: 'Hindi / English',
          certification: true,
          mode: 'Online + Offline',
          thumbnail: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=400&auto=format&fit=crop&q=80',
        },
        {
          id: 'PROG-03',
          title: 'Financial Inclusion',
          badge: 'Government Sponsored',
          institute: 'RICM, Patna',
          duration: '6 Months',
          languages: 'Hindi / English',
          certification: true,
          mode: 'Blended',
          thumbnail: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=400&auto=format&fit=crop&q=80',
        },
      ],
      careerOpportunities: {
        jobTitle: 'Accounts Assistant',
        company: 'Cooperative Bank Ltd.',
        location: 'Lucknow, UP',
        matchedSkills: '4/5 skills matched',
        skillsTag: 'Accounting, Digital Finance, KCC Ledger',
      },
      skillJourney: [
        { name: 'Accounting', percentage: 82, color: '#2563eb' },
        { name: 'Digital Finance', percentage: 61, color: '#06b6d4' },
        { name: 'Communication', percentage: 74, color: '#10b981' },
        { name: 'Data Literacy', percentage: 46, color: '#f59e0b' },
      ],
      certificatesSummary: {
        verifiedCertificates: 3,
        skillsVerified: 2,
        action: 'View Certificates',
      },
      offlineReady: {
        lessonsDownloaded: 4,
        statusText: 'Progress will sync when internet returns.',
        lastSynced: 'Synced 2 min ago',
      },
      weeklyGamification: {
        weeklyXp: 840,
        weeklyGoal: 1000,
        currentStreak: CURRENT_USER_STREAK,
        leaderboardRank: 18,
      },
    });
  },

  async getTodayLearning(req, res) {
    return sendSuccess(res, {
      courseId: 'CRS-101',
      title: 'Cooperative Accounting & Digital Finance',
      currentModule: 'Module 3: Double-Entry Bookkeeping & PACS Balance Sheets',
      completedLessons: 4,
      totalLessons: 9,
      progressPercentage: 45,
      remainingMinutes: 80,
      nextLesson: { id: 'LES-302', title: 'Asset Liability Management in Primary Societies', duration: '20 min' },
    });
  },

  async getTodayTraining(req, res) {
    return sendSuccess(res, {
      sessionDate: new Date().toISOString().split('T')[0],
      startTime: '10:30 AM',
      endTime: '12:00 PM',
      title: 'Digital Finance Workshop',
      venue: 'ICM, Jhansi • Room 203',
      trainer: 'Dr. Ramesh Chandra & Prof. R. P. Singh',
      attendanceMarked: false,
      attendanceStatus: 'Attendance Pending',
    });
  },

  async getSkillsSummary(req, res) {
    return sendSuccess(res, [
      { skill: 'Accounting', score: 82, verified: true, level: 'Proficient' },
      { skill: 'Digital Finance', score: 61, verified: true, level: 'Intermediate' },
      { skill: 'Communication', score: 74, verified: false, level: 'Advanced' },
      { skill: 'Data Literacy', score: 46, verified: false, level: 'Developing' },
    ]);
  },

  async getOfflineSummary(req, res) {
    return sendSuccess(res, {
      downloadedPackagesCount: 4,
      storageUsedMb: 142.5,
      pendingSyncEvents: 0,
      lastSyncTimestamp: new Date(Date.now() - 120000).toISOString(),
      offlineEngineVersion: 'v2.4.0-edge',
    });
  },

  // ══════════════════════════════════════════════════════════════════════════
  // DOMAIN 04 — PROGRAMME DISCOVERY (8 APIs)
  // ══════════════════════════════════════════════════════════════════════════
  async getProgrammes(req, res) {
    try {
      const programmes = await Programme.find().limit(20);
      return sendSuccess(res, programmes.length ? programmes : [
        { programmeId: 'PROG-01', title: 'Diploma in Cooperative Management', duration: '6 Months', institute: 'NCCT ICM Lucknow', category: 'Management' },
        { programmeId: 'PROG-02', title: 'Certificate in PACS Computerization & ERP', duration: '3 Months', institute: 'VAMNICOM Pune', category: 'Technical' },
        { programmeId: 'PROG-03', title: 'Executive Dairy Cooperative Entrepreneurship', duration: '4 Months', institute: 'RICM Bengaluru', category: 'Dairy' },
      ]);
    } catch (e) {
      return sendError(res, 'FETCH_PROGRAMMES_FAILED', e.message);
    }
  },

  async getRecommendedProgrammes(req, res) {
    return sendSuccess(res, [
      { id: 'PROG-01', title: 'Cooperative Management', badge: 'Popular', institute: 'NCCT ICM, Lucknow', duration: '6 Months', languages: 'Hindi / English', certification: true },
      { id: 'PROG-02', title: 'Digital Literacy', badge: 'New', institute: 'VAMNICOM, Pune', duration: '3 Months', languages: 'Hindi / English', certification: true },
      { id: 'PROG-03', title: 'Financial Inclusion', badge: 'Sponsored', institute: 'RICM, Patna', duration: '6 Months', languages: 'Hindi / English', certification: true },
    ]);
  },

  async getProgrammeCategories(req, res) {
    return sendSuccess(res, [
      { categoryId: 'CAT-1', name: 'PACS Computerization & Tech', count: 14 },
      { categoryId: 'CAT-2', name: 'Cooperative Banking & Credit', count: 18 },
      { categoryId: 'CAT-3', name: 'Dairy & FPO Entrepreneurship', count: 12 },
      { categoryId: 'CAT-4', name: 'Governance & Statutory Auditing', count: 9 },
    ]);
  },

  async getProgrammeById(req, res) {
    return sendSuccess(res, {
      programmeId: req.params.id,
      title: 'Diploma in Cooperative Management (DCM)',
      nsqfLevel: 5,
      deliveryMode: 'BLENDED_EDGE',
      description: 'Comprehensive 6-month national accreditation for supervisory and managerial cadres in cooperative organizations.',
      duration: '6 Months (24 Weeks)',
      capacity: 45,
      availableSeats: 8,
      registrationDeadline: '2026-10-15',
    });
  },

  async getProgrammeCourses(req, res) {
    return sendSuccess(res, [
      { courseId: 'CRS-101', title: 'Cooperative Accounting & Digital Finance', modulesCount: 6, hours: 40 },
      { courseId: 'CRS-102', title: 'PACS ERP Software Masterclass', modulesCount: 4, hours: 30 },
      { courseId: 'CRS-103', title: 'Statutory Cooperatives Act & Governance', modulesCount: 5, hours: 35 },
    ]);
  },

  async getProgrammeEligibility(req, res) {
    return sendSuccess(res, {
      eligible: true,
      criteria: [
        { label: 'Minimum 10+2 or Graduation', met: true },
        { label: 'Age between 18 and 35', met: true },
        { label: 'Resident of India', met: true },
      ],
      recommendation: 'You are 100% eligible to apply for this programme.',
    });
  },

  async getProgrammeSchedule(req, res) {
    return sendSuccess(res, {
      programmeId: req.params.id,
      academicYear: '2026-2027',
      batches: [
        { batchId: 'BATCH-2026-A', startDate: '2026-10-20', endDate: '2027-04-20', campus: 'ICM Jhansi' },
        { batchId: 'BATCH-2026-B', startDate: '2026-11-01', endDate: '2027-05-01', campus: 'VAMNICOM Pune' },
      ],
    });
  },

  async getProgrammeSkills(req, res) {
    return sendSuccess(res, [
      { skillId: 'SKL-01', name: 'Financial Bookkeeping & Auditing', nsqfBand: 'Level 5' },
      { skillId: 'SKL-02', name: 'PACS ERP Workflow Navigation', nsqfBand: 'Level 4' },
      { skillId: 'SKL-03', name: 'Statutory Cooperative Compliance', nsqfBand: 'Level 5' },
    ]);
  },

  // ══════════════════════════════════════════════════════════════════════════
  // DOMAIN 05 — APPLICATIONS & ENROLMENT (9 APIs)
  // ══════════════════════════════════════════════════════════════════════════
  async createApplication(req, res) {
    const applicationId = `APP-${Date.now().toString().slice(-6)}`;
    return sendSuccess(res, {
      applicationId,
      programmeId: req.body.programmeId || 'PROG-01',
      traineeId: req.headers['x-pragyaan-trainee-id'] || 'TR-DEMO-001',
      status: 'SUBMITTED',
      submittedAt: new Date().toISOString(),
      message: 'Application submitted successfully to Programme Coordinator.',
    });
  },

  async getApplications(req, res) {
    return sendSuccess(res, [
      { applicationId: 'APP-89102', programmeTitle: 'Cooperative Management', institute: 'ICM Lucknow', status: 'APPROVED', stage: 'Enrolled' },
      { applicationId: 'APP-89103', programmeTitle: 'PACS Computerization & ERP', institute: 'VAMNICOM Pune', status: 'SUBMITTED', stage: 'Under Review' },
    ]);
  },

  async getApplicationById(req, res) {
    return sendSuccess(res, {
      applicationId: req.params.id,
      programmeTitle: 'Cooperative Management',
      institute: 'NCCT ICM Lucknow',
      status: 'APPROVED',
      batchAssigned: 'BATCH-2026-01',
      reviewedBy: 'Dr. Sunita Rao (Coordinator)',
    });
  },

  async withdrawApplication(req, res) {
    return sendSuccess(res, { applicationId: req.params.id, status: 'WITHDRAWN' });
  },

  async getApplicationStatus(req, res) {
    return sendSuccess(res, {
      applicationId: req.params.id,
      status: 'APPROVED',
      steps: [
        { step: 'Submission', status: 'COMPLETED', time: '2026-09-10' },
        { step: 'Document Verification', status: 'COMPLETED', time: '2026-09-14' },
        { step: 'Institute Approval', status: 'COMPLETED', time: '2026-09-18' },
        { step: 'Batch Seat Confirmation', status: 'ACTIVE', time: '2026-09-20' },
      ],
    });
  },

  async getEnrollments(req, res) {
    return sendSuccess(res, [
      {
        enrollmentId: 'ENR-9901',
        programmeId: 'PROG-01',
        programmeTitle: 'Cooperative Accounting & Digital Finance',
        batchId: 'BATCH-2026-A',
        instituteName: 'Institute of Cooperative Management (ICM), Jhansi',
        status: 'ENROLLED',
        enrolledAt: '2026-09-01',
      },
    ]);
  },

  async getEnrollmentById(req, res) {
    return sendSuccess(res, {
      enrollmentId: req.params.id,
      traineeId: 'TR-DEMO-001',
      batchId: 'BATCH-2026-A',
      programmeTitle: 'Cooperative Accounting & Digital Finance',
      attendanceThreshold: 80,
      activeStatus: 'ACTIVE',
    });
  },

  async getEnrollmentStatus(req, res) {
    return sendSuccess(res, { enrollmentId: req.params.id, compliance: 'IN_GOOD_STANDING', attendancePercentage: 92.4 });
  },

  async getEnrollmentBatch(req, res) {
    return sendSuccess(res, {
      batchId: 'BATCH-2026-A',
      batchName: 'PGDM-ABM & PACS Executive Batch 2026',
      totalTrainees: 42,
      classRepresentative: 'Rahul Sharma',
      primaryTrainer: 'Prof. Arvind Joshi',
    });
  },

  // ══════════════════════════════════════════════════════════════════════════
  // DOMAIN 06 — MY LEARNING (15 APIs)
  // ══════════════════════════════════════════════════════════════════════════
  async getMyProgrammes(req, res) {
    return sendSuccess(res, [
      { programmeId: 'PROG-01', title: 'Cooperative Accounting & Digital Finance', progress: 45, status: 'IN_PROGRESS' },
    ]);
  },

  async getMyProgrammeById(req, res) {
    return sendSuccess(res, {
      programmeId: req.params.id,
      title: 'Cooperative Accounting & Digital Finance',
      totalCourses: 3,
      completedCourses: 1,
      currentCourse: 'CRS-101',
      progress: 45,
    });
  },

  async getMyCourses(req, res) {
    return sendSuccess(res, [
      { courseId: 'CRS-101', title: 'Cooperative Accounting & Digital Finance', modulesCount: 6, progress: 45, hours: 40 },
      { courseId: 'CRS-102', title: 'PACS ERP Master Navigation', modulesCount: 4, progress: 10, hours: 30 },
    ]);
  },

  async getMyCourseById(req, res) {
    return sendSuccess(res, {
      courseId: req.params.id,
      title: 'Cooperative Accounting & Digital Finance',
      progress: 45,
      instructor: 'Dr. Ramesh Chandra & Prof. R. P. Singh',
      skills: ['Accounting', 'Digital Finance', 'ERP Audit'],
    });
  },

  async getCourseModules(req, res) {
    return sendSuccess(res, [
      { moduleId: 'MOD-1', title: 'Cooperative Principles & Statutory Mandates', status: 'COMPLETED', progress: 100 },
      { moduleId: 'MOD-2', title: 'Double Entry System in Primary Societies', status: 'COMPLETED', progress: 100 },
      { moduleId: 'MOD-3', title: 'PACS Balance Sheets & Trial Balances', status: 'IN_PROGRESS', progress: 45 },
      { moduleId: 'MOD-4', title: 'Digital Payment Gateways & DBT in Cooperatives', status: 'LOCKED', progress: 0 },
      { moduleId: 'MOD-5', title: 'NPAs, KCC Loans & Recovery Workflows', status: 'LOCKED', progress: 0 },
      { moduleId: 'MOD-6', title: 'Final Statutory Audit & Return Filing', status: 'LOCKED', progress: 0 },
    ]);
  },

  async getModuleById(req, res) {
    return sendSuccess(res, {
      moduleId: req.params.id,
      title: 'PACS Balance Sheets & Trial Balances',
      order: 3,
      durationMinutes: 90,
      lessons: [
        { lessonId: 'LES-301', title: 'Constructing Ledger Accounts in PACS ERP', completed: true, duration: '25 min' },
        { lessonId: 'LES-302', title: 'Asset Liability Management in Primary Societies', completed: false, duration: '20 min' },
        { lessonId: 'LES-303', title: 'Rectification of Errors before Closing', completed: false, duration: '25 min' },
      ],
    });
  },

  async getLessonById(req, res) {
    return sendSuccess(res, {
      lessonId: req.params.id,
      title: 'Asset Liability Management in Primary Societies',
      type: 'VIDEO',
      videoUrl: 'https://www.youtube.com/embed/5Peo-ivmupE',
      durationMinutes: 20,
      description: 'Step-by-step masterclass on liquidity ratios, cash credit limit monitoring, and NABARD compliance.',
    });
  },

  async getLessonContent(req, res) {
    return sendSuccess(res, {
      lessonId: req.params.id,
      multilingualTranscripts: ['en', 'hi'],
      resources: [
        { title: 'ALM Worksheet Template.xlsx', size: '1.2 MB' },
        { title: 'NABARD Circular 2026.pdf', size: '3.4 MB' },
      ],
    });
  },

  async startLesson(req, res) {
    return sendSuccess(res, { lessonId: req.params.id, sessionStarted: true, timestamp: new Date() });
  },

  async updateLessonProgress(req, res) {
    return sendSuccess(res, { lessonId: req.params.id, savedPositionSeconds: req.body.position || 420 });
  },

  async completeLesson(req, res) {
    CURRENT_USER_STREAK += 1;
    return sendSuccess(res, {
      lessonId: req.params.id,
      completed: true,
      xpEarned: 50,
      updatedCourseProgress: 52,
      streakUpdated: CURRENT_USER_STREAK,
      message: `Lesson completed! +50 XP added. Learning streak incremented to ${CURRENT_USER_STREAK} days!`,
    });
  },

  async continueLearning(req, res) {
    return sendSuccess(res, {
      courseId: 'CRS-101',
      courseTitle: 'Cooperative Accounting & Digital Finance',
      moduleId: 'MOD-3',
      lessonId: 'LES-302',
      lessonTitle: 'Asset Liability Management in Primary Societies',
      progressPercentage: 45,
      resumePositionSeconds: 180,
    });
  },

  async getCompletedCourses(req, res) {
    return sendSuccess(res, [
      { courseId: 'CRS-100', title: 'Introduction to NCCT & Indian Cooperative Movement', completedAt: '2026-08-15', grade: 'A+' },
    ]);
  },

  async getLearningResources(req, res) {
    return sendSuccess(res, [
      { id: 'RES-01', title: 'National Cooperative Database Handbook 2026', type: 'PDF', pages: 124 },
      { id: 'RES-02', title: 'PACS Standard Operating Procedure (SOP) Manual', type: 'PDF', pages: 88 },
    ]);
  },

  async saveNote(req, res) {
    return sendSuccess(res, { noteId: `NOTE-${Date.now()}`, saved: true, ...req.body });
  },

  // ══════════════════════════════════════════════════════════════════════════
  // DOMAIN 07 — PROGRESS & COMPLETION (6 APIs)
  // ══════════════════════════════════════════════════════════════════════════
  async getProgress(req, res) {
    return sendSuccess(res, {
      overallPercentage: 58.4,
      programmesActive: 1,
      coursesCompleted: 2,
      lessonsWatched: 18,
      quizzesPassed: 6,
      attendancePercentage: 92.0,
    });
  },

  async getProgrammeProgress(req, res) {
    return sendSuccess(res, { programmeId: req.params.id, progressPercentage: 45.0, status: 'ON_TRACK' });
  },

  async getCourseProgress(req, res) {
    return sendSuccess(res, { courseId: req.params.id, progressPercentage: 45.0, completedModules: 2, totalModules: 6 });
  },

  async getModuleProgress(req, res) {
    return sendSuccess(res, { moduleId: req.params.id, progressPercentage: 66.6, completedLessons: 2, totalLessons: 3 });
  },

  async getLessonProgress(req, res) {
    return sendSuccess(res, { lessonId: req.params.id, completed: true, timeSpentMinutes: 22 });
  },

  async postProgressEvent(req, res) {
    return sendSuccess(res, { eventIngested: true, eventId: `EVT-${Date.now()}` });
  },

  // ══════════════════════════════════════════════════════════════════════════
  // DOMAIN 08 — OFFLINE LEARNING & SYNC (11 APIs)
  // ══════════════════════════════════════════════════════════════════════════
  async getOfflinePackages(req, res) {
    return sendSuccess(res, [
      { packageId: 'PKG-CRS-101-MOD3', title: 'PACS Balance Sheets & Trial Balances', sizeMb: 38.4, lessonsCount: 3, isDownloaded: true },
      { packageId: 'PKG-CRS-101-MOD4', title: 'Digital Payment Gateways & DBT', sizeMb: 42.1, lessonsCount: 4, isDownloaded: false },
    ]);
  },

  async getOfflinePackageById(req, res) {
    return sendSuccess(res, {
      packageId: req.params.id,
      title: 'PACS Balance Sheets Offline Bundle',
      manifestChecksum: 'a7b8c9d0e1f2a3b4c5d6e7f8',
      sizeBytes: 40265318,
      mediaCount: 3,
    });
  },

  async downloadOfflinePackage(req, res) {
    return sendSuccess(res, {
      packageId: req.params.id,
      downloadUrl: `http://localhost:5000/api/v1/learner/offline/download/${req.params.id}.pkg`,
      checksum: 'e9b2a7c4f1e0',
      expiresInMinutes: 60,
    });
  },

  async deleteOfflinePackage(req, res) {
    return sendSuccess(res, { packageId: req.params.id, deletedFromDevice: true });
  },

  async getOfflineStorage(req, res) {
    return sendSuccess(res, {
      totalCapacityMb: 32000,
      usedByPragyaanMb: 142.5,
      offlineCoursesMb: 110.2,
      offlineQuizzesMb: 8.3,
      cachedDocumentsMb: 24.0,
    });
  },

  async getOfflineStatus(req, res) {
    return sendSuccess(res, {
      isOfflineReady: true,
      downloadedLessons: 4,
      pendingOutboxEvents: 0,
      lastSync: new Date(Date.now() - 120000).toISOString(),
      syncText: 'Synced 2 min ago',
    });
  },

  async compareManifest(req, res) {
    return sendSuccess(res, { upToDate: true, serverVersion: 'v2.4.0', deviceVersion: 'v2.4.0' });
  },

  async pushSync(req, res) {
    return sendSuccess(res, {
      syncedEventsCount: req.body.events?.length || 2,
      rejectedEvents: 0,
      serverTimestamp: new Date().toISOString(),
      ack: 'ALL_OPERATIONS_COMMITTED',
    });
  },

  async pullSync(req, res) {
    return sendSuccess(res, {
      newAnnouncementsCount: 1,
      newAssessmentPublished: true,
      updatedGradeRecord: null,
    });
  },

  async getSyncStatus(req, res) {
    return sendSuccess(res, { status: 'SYNCHRONIZED', pendingOperationsCount: 0, lastHeartbeat: new Date() });
  },

  async retrySync(req, res) {
    return sendSuccess(res, { retriedCount: 0, status: 'IDLE_CLEAN' });
  },

  // ══════════════════════════════════════════════════════════════════════════
  // DOMAIN 09 — ATTENDANCE (7 APIs)
  // ══════════════════════════════════════════════════════════════════════════
  async getAttendance(req, res) {
    return sendSuccess(res, {
      traineeId: 'TR-DEMO-001',
      totalSessionsHeld: 24,
      sessionsAttended: 22,
      percentage: 91.6,
      statutoryMinimum: 80.0,
      eligibilityStatus: 'ELIGIBLE_FOR_EXAMINATION',
    });
  },

  async getAttendanceSummary(req, res) {
    return sendSuccess(res, {
      present: 22,
      absent: 2,
      excused: 0,
      attendancePercentage: 91.6,
      streakSessions: 8,
    });
  },

  async getTodaySessions(req, res) {
    return sendSuccess(res, [
      {
        sessionId: 'SESS-2026-TODAY-01',
        title: 'Digital Finance Workshop',
        timeWindow: '10:30 AM - 12:00 PM',
        room: 'ICM, Jhansi • Room 203',
        trainer: 'Dr. Ramesh Chandra',
        status: 'PENDING_SCAN',
        requiresQr: true,
      },
    ]);
  },

  async getSessionById(req, res) {
    return sendSuccess(res, {
      sessionId: req.params.id,
      title: 'Digital Finance Workshop',
      trainer: 'Dr. Ramesh Chandra',
      location: 'Room 203',
      validUntil: '12:15 PM',
    });
  },

  async validateQr(req, res) {
    const { token } = req.body;
    return sendSuccess(res, {
      valid: true,
      sessionId: 'SESS-2026-TODAY-01',
      sessionTitle: 'Digital Finance Workshop',
      instituteId: 'INST-VAMNICOM-01',
      verifiedTimestamp: new Date().toISOString(),
    });
  },

  async markAttendance(req, res) {
    return sendSuccess(res, {
      marked: true,
      attendanceId: `ATT-${Date.now().toString().slice(-6)}`,
      traineeId: 'TR-DEMO-001',
      traineeName: 'Rahul Sharma',
      sessionTitle: 'Digital Finance Workshop',
      status: 'PRESENT',
      method: req.body.verificationMethod || 'QR_DYNAMIC',
      markedAt: new Date().toISOString(),
      xpEarned: 10,
      message: 'Attendance recorded successfully! +10 XP awarded.',
    });
  },

  async getAttendanceHistory(req, res) {
    return sendSuccess(res, [
      { date: '2026-09-28', session: 'PACS ERP Setup Lab', status: 'PRESENT', method: 'QR_DYNAMIC' },
      { date: '2026-09-27', session: 'Cooperative Banking Norms', status: 'PRESENT', method: 'QR_DYNAMIC' },
      { date: '2026-09-26', session: 'Statutory Ledger Reconciliation', status: 'PRESENT', method: 'QR_DYNAMIC' },
      { date: '2026-09-25', session: 'Governance Ethics', status: 'ABSENT', method: 'SYSTEM_ABSENT' },
    ]);
  },

  // ══════════════════════════════════════════════════════════════════════════
  // DOMAIN 10 — ASSESSMENTS (11 APIs)
  // ══════════════════════════════════════════════════════════════════════════
  async getAssessments(req, res) {
    return sendSuccess(res, [
      { assessmentId: 'ASM-101', title: 'Mid-Term PACS Ledger & Double Entry Quiz', type: 'ONLINE_TIMED', durationMinutes: 30, questionsCount: 20, status: 'AVAILABLE', passingMarks: 60 },
      { assessmentId: 'ASM-102', title: 'Cooperative Law & Multi-State Societies Exam', type: 'FINAL_PROCTORED', durationMinutes: 60, questionsCount: 40, status: 'UPCOMING', passingMarks: 70 },
    ]);
  },

  async getUpcomingAssessments(req, res) {
    return sendSuccess(res, [
      { assessmentId: 'ASM-101', title: 'Mid-Term PACS Ledger & Double Entry Quiz', date: 'Available Now', duration: '30 mins' },
    ]);
  },

  async getAssessmentById(req, res) {
    return sendSuccess(res, {
      assessmentId: req.params.id,
      title: 'Mid-Term PACS Ledger & Double Entry Quiz',
      durationMinutes: 30,
      totalQuestions: 20,
      passingScore: 60,
      instructions: 'Each question carries 5 marks. No negative marking. Ensure active camera or Edge Node LAN connection.',
    });
  },

  async startAssessment(req, res) {
    const attemptId = `ATT-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 30 * 60000).toISOString();
    return sendSuccess(res, {
      attemptId,
      assessmentId: req.params.id,
      startedAt: new Date().toISOString(),
      expiresAt,
      durationMinutes: 30,
    });
  },

  async getAssessmentQuestions(req, res) {
    return sendSuccess(res, [
      {
        questionId: 'Q-01',
        text: 'In cooperative accounting, which account is credited when share capital dividend is distributed to members?',
        options: ['Member Dividend Payable A/c', 'Statutory Reserve Fund', 'Bad Debt Reserve', 'Contingency Fund'],
        marks: 5,
      },
      {
        questionId: 'Q-02',
        text: 'What is the maximum limit for cash transaction in PACS under Nabard computerization guidelines?',
        options: ['Rs 10,000', 'Rs 20,000', 'Rs 50,000', 'Rs 2,00,000'],
        marks: 5,
      },
      {
        questionId: 'Q-03',
        text: 'Which committee mandated 100% computerization of all functional PACS in India?',
        options: ['Vaidyanathan Committee', 'Kalia Committee', 'Narasimham Committee', 'Rangarajan Committee'],
        marks: 5,
      },
    ]);
  },

  async saveAssessmentAnswers(req, res) {
    return sendSuccess(res, { savedCount: req.body.answers?.length || 1, lastSaved: new Date() });
  },

  async saveAssessmentProgress(req, res) {
    return sendSuccess(res, { progressSaved: true });
  },

  async submitAssessment(req, res) {
    return sendSuccess(res, {
      submitted: true,
      attemptId: req.body.attemptId || 'ATT-101',
      score: 85,
      percentage: 85,
      grade: 'A+',
      passed: true,
      xpEarned: 50,
      badgesAwarded: ['Quiz Master'],
      message: 'Assessment submitted successfully! Score: 85% (Grade A+). +50 XP awarded.',
    });
  },

  async getAssessmentResult(req, res) {
    return sendSuccess(res, {
      assessmentId: req.params.id,
      score: 85,
      totalMarks: 100,
      percentage: 85,
      grade: 'A+',
      passed: true,
      rubrics: [
        { domain: 'Bookkeeping Fundamentals', score: 90 },
        { domain: 'Statutory Act Compliance', score: 80 },
      ],
    });
  },

  async getAssessmentHistory(req, res) {
    return sendSuccess(res, [
      { assessmentId: 'ASM-099', title: 'Cooperative Principles Foundation', date: '2026-08-20', score: 92, grade: 'O', status: 'PASSED' },
    ]);
  },

  async reviewAssessment(req, res) {
    return sendSuccess(res, {
      assessmentId: req.params.id,
      reviewed: true,
      questionsReviewed: 20,
      correctCount: 17,
      incorrectCount: 3,
    });
  },

  // ══════════════════════════════════════════════════════════════════════════
  // DOMAIN 11 — COMPLETION (3 APIs)
  // ══════════════════════════════════════════════════════════════════════════
  async getCompletionStatus(req, res) {
    return sendSuccess(res, {
      programmeTitle: 'Cooperative Accounting & Digital Finance',
      learningRequirementMet: false,
      learningProgress: 45,
      attendanceRequirementMet: true,
      attendanceRate: 91.6,
      assessmentsRequirementMet: true,
      overallEligibility: 'IN_PROGRESS',
    });
  },

  async getProgrammeCompletion(req, res) {
    return sendSuccess(res, {
      programmeId: req.params.id,
      completionPercentage: 58.4,
      estimatedCompletionDate: '2026-11-30',
    });
  },

  async getCompletionRequirements(req, res) {
    return sendSuccess(res, [
      { requirement: 'Watch all 6 Course Modules', status: '3/6 Done', met: false },
      { requirement: 'Minimum 80% Attendance', status: '91.6%', met: true },
      { requirement: 'Pass Mid-Term & Final Exam', status: '1/2 Passed', met: false },
    ]);
  },

  // ══════════════════════════════════════════════════════════════════════════
  // DOMAIN 12 — CERTIFICATES (6 APIs)
  // ══════════════════════════════════════════════════════════════════════════
  async getCertificates(req, res) {
    return sendSuccess(res, [
      {
        certificateId: 'CERT-NCCT-2025-001',
        title: 'Food Safety & Quality',
        issuer: 'National Council for Cooperative Training (NCCT)',
        issueDate: '15 May 2025',
        completedDate: '15 May 2025',
        recipientName: 'Rahul Kumar',
        nsqfLevel: 5,
        credentialUrl: 'http://localhost:3004/verify/CRED-NCCT-FSQ-2025',
        status: 'VERIFIED',
      },
      {
        certificateId: 'CERT-NCCT-2025-002',
        title: 'Cooperative Management',
        issuer: 'VAMNICOM, Pune',
        issueDate: '10 Apr 2025',
        completedDate: '10 Apr 2025',
        recipientName: 'Rahul Kumar',
        nsqfLevel: 4,
        credentialUrl: 'http://localhost:3004/verify/CRED-NCCT-CM-2025',
        status: 'VERIFIED',
      },
      {
        certificateId: 'CERT-NCCT-2025-003',
        title: 'Digital Skills',
        issuer: 'ICM Lucknow',
        issueDate: '28 Feb 2025',
        completedDate: '28 Feb 2025',
        recipientName: 'Rahul Kumar',
        nsqfLevel: 4,
        credentialUrl: 'http://localhost:3004/verify/CRED-NCCT-DS-2025',
        status: 'VERIFIED',
      },
    ]);
  },

  async getCertificateById(req, res) {
    return sendSuccess(res, {
      certificateId: req.params.id,
      title: 'National Certificate in Cooperative Accounting & PACS Audit',
      recipientName: 'Rahul Sharma',
      directorGeneral: 'Dr. Ramesh Chandra',
      institute: 'VAMNICOM, Pune',
      issueDate: '2026-08-15',
      grade: 'O (Outstanding)',
      sha256Hash: '4f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0',
      status: 'AUTHENTIC_TAMPER_EVIDENT',
    });
  },

  async getCertificateQr(req, res) {
    return sendSuccess(res, {
      certificateId: req.params.id,
      qrToken: `PRAGYAAN_CERT_${req.params.id}_HMAC_SHA256`,
      verificationUrl: `http://localhost:3004/verify/${req.params.id}`,
    });
  },

  async downloadCertificatePdf(req, res) {
    return sendSuccess(res, {
      downloadUrl: `http://localhost:5000/api/v1/certificates/download/${req.params.id}.pdf`,
      filename: `Pragyaan_Certificate_${req.params.id}.pdf`,
      mimeType: 'application/pdf',
    });
  },

  async shareCertificate(req, res) {
    return sendSuccess(res, {
      shareableUrl: `http://localhost:3004/verify/${req.params.id}`,
      linkedInBadgeUrl: `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=Cooperative+Accounting&organizationName=NCCT`,
    });
  },

  async verifyCertificate(req, res) {
    return sendSuccess(res, {
      valid: true,
      certificateId: req.params.id,
      recipient: 'Rahul Sharma',
      status: 'AUTHENTIC',
      verifiedAtNCCTCentralRegistry: true,
    });
  },

  // ══════════════════════════════════════════════════════════════════════════
  // DOMAIN 13 — SKILLS & COMPETENCIES (7 APIs)
  // ══════════════════════════════════════════════════════════════════════════
  async getSkills(req, res) {
    return sendSuccess(res, [
      { skillId: 'SKL-01', name: 'Accounting', proficiency: 82, level: 'Proficient', verified: true, color: '#2563eb' },
      { skillId: 'SKL-02', name: 'Digital Finance', proficiency: 61, level: 'Intermediate', verified: true, color: '#06b6d4' },
      { skillId: 'SKL-03', name: 'Communication', proficiency: 74, level: 'Advanced', verified: false, color: '#10b981' },
      { skillId: 'SKL-04', name: 'Data Literacy', proficiency: 46, level: 'Developing', verified: false, color: '#f59e0b' },
    ]);
  },

  async getVerifiedSkills(req, res) {
    return sendSuccess(res, [
      { name: 'Accounting', score: 82, verifiedBy: 'Prof. R. P. Singh', date: '2026-08-15' },
      { name: 'Digital Finance', score: 61, verifiedBy: 'Dr. Sunita Rao', date: '2026-06-30' },
    ]);
  },

  async getInProgressSkills(req, res) {
    return sendSuccess(res, [
      { name: 'Data Literacy', score: 46, targetCourse: 'CRS-101 Module 4' },
      { name: 'PACS ERP Auditing', score: 35, targetCourse: 'CRS-102' },
    ]);
  },

  async getSkillGaps(req, res) {
    return sendSuccess(res, [
      { targetRole: 'PACS Accounts Manager', currentMatch: 80, missingSkills: ['KCC Recovery Legal Framework'] },
      { targetRole: 'Cooperative Bank Loan Officer', currentMatch: 65, missingSkills: ['Credit Appraisal Scorecard', 'CIBIL Analysis'] },
    ]);
  },

  async getSkillById(req, res) {
    return sendSuccess(res, {
      skillId: req.params.id,
      name: 'Accounting',
      proficiency: 82,
      evidenceRecordsCount: 3,
      nsqfLevel: 5,
    });
  },

  async getSkillEvidence(req, res) {
    return sendSuccess(res, [
      { evidenceId: 'EVD-01', type: 'EXAMINATION', name: 'Cooperative Ledger Exam', score: 88, date: '2026-08-15' },
      { evidenceId: 'EVD-02', type: 'PRACTICAL_LAB', name: 'PACS ERP Balance Sheet Simulation', score: 85, date: '2026-09-20' },
    ]);
  },

  async getSkillRecommendations(req, res) {
    return sendSuccess(res, [
      { courseId: 'CRS-102', title: 'PACS ERP Master Navigation', boostSkill: 'Data Literacy (+25%)' },
    ]);
  },

  // ══════════════════════════════════════════════════════════════════════════
  // DOMAIN 14 — CAREER AI (7 APIs)
  // ══════════════════════════════════════════════════════════════════════════
  async askCareerAi(req, res) {
    const { prompt } = req.body;
    return sendSuccess(res, {
      response: `Based on your high proficiency in Accounting (82%) and verified NCCT certification, you qualify for 4 cooperative banking positions in Uttar Pradesh! I recommend completing Module 4 (Digital Payment Gateways) to increase your candidate match score to 96%.`,
      suggestedActions: [
        'Apply for Accounts Assistant at Cooperative Bank Ltd (4/5 skills matched)',
        'Enroll in KCC Recovery Workflows short module',
      ],
      timestamp: new Date().toISOString(),
    });
  },

  async getCareerRecommendations(req, res) {
    return sendSuccess(res, [
      { role: 'Accounts Assistant', matchPercentage: 88, averageSalary: '₹28,000 / mo', openings: 5 },
      { role: 'PACS Manager', matchPercentage: 82, averageSalary: '₹35,000 / mo', openings: 12 },
      { role: 'FPO Financial Advisor', matchPercentage: 75, averageSalary: '₹32,000 / mo', openings: 7 },
    ]);
  },

  async getCareerSkillGaps(req, res) {
    return sendSuccess(res, {
      targetRole: 'Accounts Assistant',
      matchedSkills: ['Double-Entry Accounting', 'Trial Balance', 'PACS Ledger', 'MS Excel'],
      missingSkills: ['Statutory GST for Cooperatives'],
      matchPercentage: 80,
    });
  },

  async getCareerLearningPath(req, res) {
    return sendSuccess(res, [
      { step: 1, title: 'Finish Cooperative Accounting Module 3 & 4', status: 'IN_PROGRESS' },
      { step: 2, title: 'Attempt Final NCCT Level 5 Certification Exam', status: 'PENDING' },
      { step: 3, title: '1-Click Direct Application to Lucknow Urban Cooperative Bank', status: 'PENDING' },
    ]);
  },

  async getCareerRoles(req, res) {
    return sendSuccess(res, [
      { role: 'PACS Executive Secretary', demand: 'VERY_HIGH', minExp: '0-1 year' },
      { role: 'Cooperative Banking Clerk', demand: 'HIGH', minExp: 'Fresh Graduate' },
    ]);
  },

  async getCareerProfile(req, res) {
    return sendSuccess(res, {
      readinessScore: 82,
      resumeBuilt: true,
      placementStatus: 'SEEKING_OPPORTUNITIES',
      preferredLocations: ['Jhansi', 'Lucknow', 'Kanpur', 'Pune'],
    });
  },

  async updateCareerInterests(req, res) {
    return sendSuccess(res, { updated: true, interests: req.body });
  },

  // ══════════════════════════════════════════════════════════════════════════
  // DOMAIN 15 — JOBS & VACANCIES (7 APIs)
  // ══════════════════════════════════════════════════════════════════════════
  async getJobs(req, res) {
    try {
      const dbVacancies = await Vacancy.find({ status: 'OPEN' }).sort({ createdAt: -1 }).lean();
      if (dbVacancies && dbVacancies.length > 0) {
        const mapped = dbVacancies.map((v) => ({
          vacancyId: v.vacancyId,
          title: v.title,
          companyName: v.companyName,
          location: v.location,
          jobType: v.employmentType === 'FULL_TIME' ? 'Full Time' : (v.employmentType || 'Full Time'),
          salaryRange: `₹${(v.minSalary || 20000).toLocaleString('en-IN')} - ${(v.maxSalary || 35000).toLocaleString('en-IN')} / month`,
          matchedSkills: `${Math.min(v.requiredSkills?.length || 3, 4)}/${v.requiredSkills?.length || 4} skills matched`,
          aiMatchScore: 88 + (Math.abs(v.vacancyId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 10),
          iconType: v.sector?.toLowerCase().includes('dairy') ? 'dairy' : (v.sector?.toLowerCase().includes('tech') ? 'it' : 'agri'),
          deadline: v.deadline ? new Date(v.deadline).toISOString().split('T')[0] : '2026-11-30',
          workMode: v.workMode || 'ONSITE',
          requiredSkills: v.requiredSkills || [],
          description: v.description,
          openings: v.openings,
        }));
        return sendSuccess(res, mapped);
      }
    } catch (e) {
      console.error('Error fetching jobs for learner:', e);
    }

    return sendSuccess(res, [
      {
        vacancyId: 'VAC-2026-001',
        title: 'Food Quality Supervisor',
        companyName: 'AgriTech Foods Pvt. Ltd.',
        location: 'Jhansi, UP',
        jobType: 'Full Time',
        salaryRange: '₹15,000 - 22,000 / month',
        matchedSkills: '4/5 skills matched',
        aiMatchScore: 92,
        iconType: 'agri',
        deadline: '2026-10-30',
        workMode: 'ONSITE',
      },
      {
        vacancyId: 'VAC-2026-002',
        title: 'Quality Control Assistant',
        companyName: 'Coop Dairy Ltd.',
        location: 'Lucknow, UP',
        jobType: 'Full Time',
        salaryRange: '₹12,000 - 18,000 / month',
        matchedSkills: '3/4 skills matched',
        aiMatchScore: 86,
        iconType: 'dairy',
        deadline: '2026-11-15',
        workMode: 'ONSITE',
      },
      {
        vacancyId: 'VAC-2026-003',
        title: 'Field Coordinator',
        companyName: 'Rural Development Trust',
        location: 'Bhopal, MP',
        jobType: 'Contract',
        salaryRange: '₹10,000 - 15,000 / month',
        matchedSkills: '3/3 skills matched',
        aiMatchScore: 95,
        iconType: 'trust',
        deadline: '2026-11-20',
        workMode: 'FIELD',
      },
      {
        vacancyId: 'VAC-2026-004',
        title: 'Senior Software Engineer',
        companyName: 'Amazon',
        location: 'Seattle, USA',
        jobType: 'Full-time • On-site',
        salaryRange: '$120K – $160K / year',
        matchedSkills: '5/5 skills matched',
        aiMatchScore: 92,
        iconType: 'tech',
        deadline: '2026-12-01',
        workMode: 'ONSITE',
      },
    ]);
  },

  async getRecommendedJobs(req, res) {
    try {
      const dbVacancies = await Vacancy.find({ status: 'OPEN' }).sort({ createdAt: -1 }).limit(5).lean();
      if (dbVacancies && dbVacancies.length > 0) {
        const mapped = dbVacancies.map((v) => ({
          vacancyId: v.vacancyId,
          title: v.title,
          companyName: v.companyName,
          location: v.location,
          jobType: v.employmentType === 'FULL_TIME' ? 'Full Time' : (v.employmentType || 'Full Time'),
          salaryRange: `₹${(v.minSalary || 20000).toLocaleString('en-IN')} - ${(v.maxSalary || 35000).toLocaleString('en-IN')} / month`,
          matchedScore: 88 + (Math.abs(v.vacancyId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 10),
          matchTag: `${Math.min(v.requiredSkills?.length || 3, 4)}/${v.requiredSkills?.length || 4} skills matched`,
          iconType: v.sector?.toLowerCase().includes('dairy') ? 'dairy' : (v.sector?.toLowerCase().includes('tech') ? 'it' : 'agri'),
        }));
        return sendSuccess(res, mapped);
      }
    } catch (e) {
      console.error('Error fetching recommended jobs for learner:', e);
    }

    return sendSuccess(res, [
      {
        vacancyId: 'VAC-2026-001',
        title: 'Food Quality Supervisor',
        companyName: 'AgriTech Foods Pvt. Ltd.',
        location: 'Jhansi, UP',
        jobType: 'Full Time',
        salaryRange: '₹15,000 - 22,000 / month',
        matchedScore: 92,
        matchTag: '4/5 skills matched',
        iconType: 'agri',
      },
      {
        vacancyId: 'VAC-2026-002',
        title: 'Quality Control Assistant',
        companyName: 'Coop Dairy Ltd.',
        location: 'Lucknow, UP',
        jobType: 'Full Time',
        salaryRange: '₹12,000 - 18,000 / month',
        matchedScore: 86,
        matchTag: '3/4 skills matched',
        iconType: 'dairy',
      },
      {
        vacancyId: 'VAC-2026-003',
        title: 'Field Coordinator',
        companyName: 'Rural Development Trust',
        location: 'Bhopal, MP',
        jobType: 'Contract',
        salaryRange: '₹10,000 - 15,000 / month',
        matchedScore: 95,
        matchTag: '3/3 skills matched',
        iconType: 'trust',
      },
    ]);
  },

  async getJobById(req, res) {
    const id = req.params.id;
    if (id === 'VAC-2026-004' || req.query.company === 'Amazon') {
      return sendSuccess(res, {
        vacancyId: 'VAC-2026-004',
        title: 'Senior Software Engineer',
        companyName: 'Amazon',
        verified: true,
        location: 'Seattle, USA',
        employmentType: 'Full-time • On-site',
        salary: '$120K – $160K / year',
        coverImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
        companyLogo: 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Amazon_icon.svg',
        perks: [
          { icon: 'shield', label: 'Health Insurance' },
          { icon: 'trending_up', label: '401(k) Matching' },
          { icon: 'calendar_month', label: 'Flexible Schedule' },
          { icon: 'home', label: 'Remote Option' },
        ],
        description: 'As a Senior Software Engineer, you\'ll work on cutting-edge products, build scalable systems, and collaborate with world-class teams to solve real-world problems and deliver amazing customer experiences.',
        aiMatchScore: 92,
        aiMatchText: 'You\'re a great fit for this role based on your skills and experience.',
        keySkills: ['React', 'Node.js', 'AWS', 'TypeScript', 'System Design'],
      });
    }

    return sendSuccess(res, {
      vacancyId: id || 'VAC-2026-001',
      title: id === 'VAC-2026-002' ? 'Quality Control Assistant' : id === 'VAC-2026-003' ? 'Field Coordinator' : 'Food Quality Supervisor',
      companyName: id === 'VAC-2026-002' ? 'Coop Dairy Ltd.' : id === 'VAC-2026-003' ? 'Rural Development Trust' : 'AgriTech Foods Pvt. Ltd.',
      verified: true,
      location: id === 'VAC-2026-002' ? 'Lucknow, UP' : id === 'VAC-2026-003' ? 'Bhopal, MP' : 'Jhansi, UP',
      employmentType: id === 'VAC-2026-003' ? 'Contract • On-site' : 'Full-time • On-site',
      salary: id === 'VAC-2026-002' ? '₹12,000 - 18,000 / month' : id === 'VAC-2026-003' ? '₹10,000 - 15,000 / month' : '₹15,000 - 22,000 / month',
      coverImage: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&auto=format&fit=crop&q=80',
      companyLogo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&auto=format&fit=crop&q=80',
      perks: [
        { icon: 'shield', label: 'Health Insurance' },
        { icon: 'trending_up', label: 'EPF & Bonus' },
        { icon: 'calendar_month', label: 'Flexible Shift' },
        { icon: 'home', label: 'Housing Allowance' },
      ],
      description: 'As Food Quality Supervisor, you will lead quality assurance testing across dairy and food cooperative processing batches, ensuring FSSAI & HACCP compliance, digital batch record keeping, and member safety.',
      aiMatchScore: 92,
      aiMatchText: 'You\'re a great fit for this role based on your skills and experience.',
      keySkills: ['Food Safety', 'Quality Audit', 'HACCP Standards', 'Inspection', 'Digital Records'],
    });
  },

  async saveJob(req, res) {
    return sendSuccess(res, { vacancyId: req.params.id, bookmarked: true });
  },

  async unsaveJob(req, res) {
    return sendSuccess(res, { vacancyId: req.params.id, bookmarked: false });
  },

  async getSavedJobs(req, res) {
    return sendSuccess(res, [
      { vacancyId: 'VAC-2026-001', title: 'Accounts Assistant', companyName: 'Cooperative Bank Ltd.' },
    ]);
  },

  async getJobMatchDetails(req, res) {
    return sendSuccess(res, {
      vacancyId: req.params.id,
      matchPercentage: 88,
      matchingSkills: ['Accounting (82%)', 'Digital Finance (61%)', 'Communication (74%)', 'Cooperative Banking Norms'],
      missingSkills: ['GST Returns Filing'],
    });
  },

  // ══════════════════════════════════════════════════════════════════════════
  // DOMAIN 16 — JOB APPLICATIONS, INTERVIEWS & EMPLOYMENT (14 APIs)
  // ══════════════════════════════════════════════════════════════════════════
  async applyForJob(req, res) {
    return sendSuccess(res, {
      applicationId: `JOB-APP-${Date.now().toString().slice(-6)}`,
      vacancyId: req.body.vacancyId || 'VAC-2026-001',
      status: 'APPLIED',
      appliedAt: new Date().toISOString(),
      message: 'Application submitted directly to hiring recruiter.',
    });
  },

  async getJobApplications(req, res) {
    return sendSuccess(res, [
      {
        applicationId: 'JOB-APP-101',
        title: 'Accounts Assistant',
        companyName: 'Cooperative Bank Ltd.',
        status: 'SHORTLISTED',
        appliedDate: '2026-09-18',
        stage: 'Interview Scheduled',
      },
    ]);
  },

  async getJobApplicationById(req, res) {
    return sendSuccess(res, {
      applicationId: req.params.id,
      title: 'Accounts Assistant',
      companyName: 'Cooperative Bank Ltd.',
      status: 'SHORTLISTED',
      recruiterNotes: 'Candidate demonstrated strong PACS accounting acumen.',
    });
  },

  async withdrawJobApplication(req, res) {
    return sendSuccess(res, { applicationId: req.params.id, status: 'WITHDRAWN' });
  },

  async getJobApplicationStatus(req, res) {
    return sendSuccess(res, { applicationId: req.params.id, currentStatus: 'SHORTLISTED', nextStage: 'Virtual Interview' });
  },

  async getJobApplicationTimeline(req, res) {
    return sendSuccess(res, [
      { stage: 'Applied', date: '2026-09-18', done: true },
      { stage: 'Profile Screening', date: '2026-09-20', done: true },
      { stage: 'Shortlisted for Interview', date: '2026-09-24', done: true },
      { stage: 'Interview', date: '2026-10-04', done: false },
    ]);
  },

  async getInterviews(req, res) {
    return sendSuccess(res, [
      {
        interviewId: 'INT-901',
        companyName: 'Cooperative Bank Ltd.',
        role: 'Accounts Assistant',
        date: '2026-10-04',
        time: '11:00 AM IST',
        mode: 'VIRTUAL_MEET',
        meetingUrl: 'https://meet.google.com/ncct-coop-demo',
        status: 'CONFIRMED',
      },
    ]);
  },

  async getInterviewById(req, res) {
    return sendSuccess(res, {
      interviewId: req.params.id,
      company: 'Cooperative Bank Ltd.',
      panel: 'Shri A. K. Verma (Chief Financial Officer)',
      instructions: 'Please keep NCCT certificate number and photo ID ready.',
    });
  },

  async confirmInterview(req, res) {
    return sendSuccess(res, { interviewId: req.params.id, confirmed: true });
  },

  async rescheduleInterview(req, res) {
    return sendSuccess(res, { interviewId: req.params.id, requestedSlot: req.body.slot, status: 'RESCHEDULE_PENDING' });
  },

  async getInterviewDocuments(req, res) {
    return sendSuccess(res, [
      { name: 'NCCT Level 5 Certificate.pdf', verified: true },
      { name: 'Graduation Degree.pdf', verified: true },
    ]);
  },

  async getEmploymentRecord(req, res) {
    return sendSuccess(res, {
      employed: false,
      activeOffersCount: 1,
      placementAssistanceActive: true,
    });
  },

  async getEmploymentOutcomes(req, res) {
    return sendSuccess(res, {
      ncctPlacementRate: 88.4,
      averageStartingSalary: '₹3,20,000 / annum',
      topRecruiters: ['Amul / GCMMF', 'IFFCO', 'KRIBHCO', 'State Apex Banks'],
    });
  },

  async submitEmploymentOutcome(req, res) {
    return sendSuccess(res, { outcomeId: `OUT-${Date.now()}`, recorded: true, status: 'VERIFIED_BY_PLACEMENT_OFFICER' });
  },

  // ══════════════════════════════════════════════════════════════════════════
  // DOMAIN 17 — COMMUNITY & CHALLENGES (20 APIs)
  // ══════════════════════════════════════════════════════════════════════════
  async createCommunityQuestion(req, res) {
    const newQ = {
      questionId: `Q-COMM-${Date.now().toString().slice(-4)}`,
      authorId: req.headers['x-pragyaan-trainee-id'] || 'TR-DEMO-001',
      authorName: 'Rahul Sharma',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      title: req.body.title || 'How to file annual cooperative returns?',
      description: req.body.description || '',
      category: req.body.category || 'General',
      programmeId: req.body.programmeId || 'PROG-01',
      tags: req.body.tags || ['CoopReturn'],
      views: 1,
      upvotes: 0,
      answersCount: 0,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      answers: [],
    };
    COMMUNITY_QUESTIONS_BUFFER.unshift(newQ);
    return sendSuccess(res, newQ, null, { xpEarned: 10, message: 'Question posted! +10 XP awarded.' });
  },

  async getCommunityQuestions(req, res) {
    return sendSuccess(res, COMMUNITY_QUESTIONS_BUFFER);
  },

  async getCommunityQuestionById(req, res) {
    const q = COMMUNITY_QUESTIONS_BUFFER.find((item) => item.questionId === req.params.id) || COMMUNITY_QUESTIONS_BUFFER[0];
    return sendSuccess(res, q);
  },

  async updateCommunityQuestion(req, res) {
    return sendSuccess(res, { questionId: req.params.id, updated: true });
  },

  async deleteCommunityQuestion(req, res) {
    return sendSuccess(res, { questionId: req.params.id, deleted: true });
  },

  async createCommunityAnswer(req, res) {
    const ans = {
      answerId: `ANS-${Date.now().toString().slice(-4)}`,
      authorId: 'TR-DEMO-001',
      authorName: 'Rahul Sharma',
      content: req.body.content || 'According to Section 24 of the Act, returns must be filed within 6 months.',
      upvotes: 0,
      accepted: false,
      createdAt: new Date().toISOString(),
    };
    return sendSuccess(res, ans, null, { xpEarned: 15, message: 'Answer posted! +15 XP awarded.' });
  },

  async getCommunityAnswers(req, res) {
    return sendSuccess(res, COMMUNITY_QUESTIONS_BUFFER[0].answers);
  },

  async updateCommunityAnswer(req, res) {
    return sendSuccess(res, { answerId: req.params.id, updated: true });
  },

  async deleteCommunityAnswer(req, res) {
    return sendSuccess(res, { answerId: req.params.id, deleted: true });
  },

  async upvoteCommunityAnswer(req, res) {
    return sendSuccess(res, { answerId: req.params.id, upvoted: true, newTotal: 20 });
  },

  async removeUpvoteAnswer(req, res) {
    return sendSuccess(res, { answerId: req.params.id, upvoted: false });
  },

  async createCommunityChallenge(req, res) {
    const newChal = {
      challengeId: `CHAL-${Date.now().toString().slice(-4)}`,
      creatorId: 'TR-DEMO-001',
      creatorName: 'Rahul Sharma',
      title: req.body.title || 'PACS Balance Sheet Lightning Round',
      question: req.body.question || 'Which ledger entry represents cash with District Co-op Bank?',
      options: req.body.options || [
        { id: 'A', text: 'Current Asset' },
        { id: 'B', text: 'Current Liability' },
        { id: 'C', text: 'Contingency Fund' },
        { id: 'D', text: 'Bad Debt Reserve' },
      ],
      correctOption: req.body.correctOption || 'A',
      explanation: req.body.explanation || 'Balances with DCCB are liquid current assets under cooperative banking rules.',
      timeLimitSeconds: 30,
      pointsReward: 20,
      category: req.body.category || 'Accounting',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    COMMUNITY_CHALLENGES_BUFFER.unshift(newChal);
    return sendSuccess(res, newChal, null, { xpEarned: 10, message: 'Challenge created! +10 XP awarded.' });
  },

  async getCommunityChallenges(req, res) {
    return sendSuccess(res, COMMUNITY_CHALLENGES_BUFFER);
  },

  async getCommunityChallengeById(req, res) {
    const chal = COMMUNITY_CHALLENGES_BUFFER.find((c) => c.challengeId === req.params.id) || COMMUNITY_CHALLENGES_BUFFER[0];
    return sendSuccess(res, chal);
  },

  async startCommunityChallenge(req, res) {
    const attemptId = `CHAL-ATT-${Date.now()}`;
    ACTIVE_CHALLENGE_ATTEMPTS[attemptId] = {
      challengeId: req.params.id,
      startedAt: Date.now(),
      expiresAt: Date.now() + 30000,
    };
    return sendSuccess(res, {
      attemptId,
      challengeId: req.params.id,
      timeLimitSeconds: 30,
      startedAt: new Date().toISOString(),
    });
  },

  async submitCommunityChallenge(req, res) {
    const { attemptId, selectedOption } = req.body;
    const chal = COMMUNITY_CHALLENGES_BUFFER.find((c) => c.challengeId === req.params.id) || COMMUNITY_CHALLENGES_BUFFER[0];
    const isCorrect = selectedOption === chal.correctOption;
    const xpAwarded = isCorrect ? chal.pointsReward : 0;
    return sendSuccess(res, {
      correct: isCorrect,
      selectedOption,
      correctOption: chal.correctOption,
      explanation: chal.explanation,
      xpEarned: xpAwarded,
      newWeeklyXp: 840 + xpAwarded,
      newLeaderboardRank: 17,
      message: isCorrect ? `🎉 Correct! +${xpAwarded} XP added to your weekly rank.` : 'Not quite. Review the explanation and try another challenge!',
    });
  },

  async getCommunityChallengeResult(req, res) {
    return sendSuccess(res, { score: 100, xpEarned: 20, rankImprovedBy: 1 });
  },

  async getCommunityFeed(req, res) {
    return sendSuccess(res, {
      trendingTopics: ['#PACSComputerization', '#HACCPDairy', '#MSCSAct2002', '#KCCLoans'],
      activeDiscussionsCount: 38,
      recentQuestions: COMMUNITY_QUESTIONS_BUFFER,
    });
  },

  async getCommunityTrending(req, res) {
    return sendSuccess(res, [
      { tag: '#PACSComputerization', questionsCount: 42 },
      { tag: '#DairyTech', questionsCount: 28 },
      { tag: '#CoopAccounting', questionsCount: 35 },
    ]);
  },

  async reportCommunityContent(req, res) {
    return sendSuccess(res, { reported: true, message: 'Content flagged for NCCT academic moderator review.' });
  },

  // ══════════════════════════════════════════════════════════════════════════
  // DOMAIN 18 — GAMIFICATION, NOTIFICATIONS & SETTINGS (36 APIs)
  // ══════════════════════════════════════════════════════════════════════════
  async getGamificationProfile(req, res) {
    return sendSuccess(res, {
      totalXp: CURRENT_USER_XP,
      weeklyXp: CURRENT_USER_XP > 1000 ? CURRENT_USER_XP - 410 : 840,
      weeklyGoal: 1500,
      currentLevel: Math.floor(CURRENT_USER_XP / 400) + 1,
      levelTitle: CURRENT_USER_XP > 2000 ? 'Apex Cooperative Scholar' : 'Senior Sahakar Pioneer',
      currentStreak: CURRENT_USER_STREAK,
      longestStreak: 14,
      leaderboardRank: CURRENT_USER_XP >= 2450 ? 1 : CURRENT_USER_XP >= 2120 ? 2 : CURRENT_USER_XP >= 1980 ? 3 : CURRENT_USER_XP >= 1760 ? 4 : CURRENT_USER_XP >= 1620 ? 5 : CURRENT_USER_XP >= 1480 ? 6 : CURRENT_USER_XP >= 1320 ? 7 : CURRENT_USER_XP >= 1210 ? 8 : 18,
      badgesCount: CURRENT_USER_BADGES,
      completedChallenges: CURRENT_USER_CHALLENGES,
    });
  },

  async getPoints(req, res) {
    return sendSuccess(res, { totalPoints: CURRENT_USER_XP, weeklyPoints: 840 });
  },

  async awardPoints(req, res) {
    const points = parseInt(req.body.points || req.body.xp || 50, 10);
    CURRENT_USER_XP += points;
    if (req.body.completedChallenge) {
      CURRENT_USER_CHALLENGES += 1;
    }
    return sendSuccess(res, {
      awardedPoints: points,
      totalXp: CURRENT_USER_XP,
      message: `🎉 +${points} XP awarded! Total balance: ${CURRENT_USER_XP} XP`,
    });
  },

  async getPointsHistory(req, res) {
    return sendSuccess(res, [
      { id: 'TX-1', event: 'LESSON_COMPLETED', title: 'Asset Liability Management', points: 15, date: 'Today, 2:15 PM' },
      { id: 'TX-2', event: 'ATTENDANCE_MARKED', title: 'Digital Finance Workshop (QR)', points: 10, date: 'Today, 10:35 AM' },
      { id: 'TX-3', event: 'CHALLENGE_SOLVED', title: 'Food Safety HACCP Challenge', points: 20, date: 'Yesterday' },
      { id: 'TX-4', event: 'QUIZ_PASSED', title: 'Cooperative Law Quiz', points: 50, date: '2 days ago' },
    ]);
  },

  async getLevelInfo(req, res) {
    return sendSuccess(res, {
      currentLevel: Math.floor(CURRENT_USER_XP / 400) + 1,
      levelTitle: CURRENT_USER_XP > 2000 ? 'Apex Cooperative Scholar' : 'Senior Sahakar Pioneer',
      xpForNextLevel: (Math.floor(CURRENT_USER_XP / 400) + 2) * 400,
      remainingXp: ((Math.floor(CURRENT_USER_XP / 400) + 2) * 400) - CURRENT_USER_XP,
      nextLevelTitle: 'Apex Cooperative Scholar (Level 5)',
    });
  },

  async getStreakInfo(req, res) {
    return sendSuccess(res, {
      currentStreak: CURRENT_USER_STREAK,
      longestStreak: 14,
      streakActiveToday: true,
      last7Days: [
        { day: 'Mon', active: true, xp: 20 },
        { day: 'Tue', active: true, xp: 80 },
        { day: 'Wed', active: true, xp: 100 },
        { day: 'Thu', active: true, xp: 150 },
        { day: 'Fri', active: true, xp: 120 },
        { day: 'Sat', active: true, xp: 170 },
        { day: 'Sun', active: true, xp: 200 },
      ],
    });
  },

  async getBadges(req, res) {
    return sendSuccess(res, [
      { id: 'BDG-01', name: 'Consistent Learner', icon: '🔥', description: 'Maintained a 7-day learning streak', unlocked: true, awardedDate: '2026-09-28' },
      { id: 'BDG-02', name: 'Quiz Master', icon: '🎯', description: 'Scored 85%+ on three consecutive exams', unlocked: true, awardedDate: '2026-09-20' },
      { id: 'BDG-03', name: 'Course Finisher', icon: '🏆', description: 'Completed first NCCT accredited course', unlocked: true, awardedDate: '2026-08-15' },
      { id: 'BDG-04', name: 'Community Helper', icon: '🤝', description: 'Provided 5 peer-accepted answers', unlocked: true, awardedDate: '2026-09-25' },
      { id: 'BDG-05', name: 'Edge Sync Pioneer', icon: '⚡', description: 'Synchronized offline attendance via Smart Node', unlocked: true, awardedDate: '2026-09-12' },
      { id: 'BDG-06', name: 'Apex Scholar', icon: '👑', description: 'Attain Level 5 Mastery', unlocked: CURRENT_USER_XP >= 2000 },
    ]);
  },

  async getAchievements(req, res) {
    return sendSuccess(res, [
      { title: 'Course Finisher', progress: 100, complete: true },
      { title: 'Quiz Master', progress: 80, complete: true },
      { title: 'Community Helper', progress: 60, complete: false },
    ]);
  },

  async getLeaderboard(req, res) {
    const tab = (req.query.tab || 'global').toLowerCase();

    if (tab === 'friends') {
      return sendSuccess(res, [
        { rank: 1, name: 'Rahul Sharma (You)', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80', institute: 'ICM Jhansi', xp: CURRENT_USER_XP, badge: '👑 1st' },
        { rank: 2, name: 'Neha Verma', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80', institute: 'ICM Jhansi', xp: 1220, badge: '🥈 2nd' },
        { rank: 3, name: 'Sandeep Gupta', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80', institute: 'ICM Jhansi', xp: 1190, badge: '🥉 3rd' },
        { rank: 4, name: 'Pooja Tiwari', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80', institute: 'ICM Jhansi', xp: 1140 },
        { rank: 5, name: 'Deepak Kumar', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80', institute: 'ICM Jhansi', xp: 1020 },
      ]);
    }

    if (tab === 'institute') {
      return sendSuccess(res, [
        { rank: 1, name: 'Neha Verma', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80', institute: 'ICM Jhansi', xp: 1980, badge: '👑 1st' },
        { rank: 2, name: 'Rahul Sharma (You)', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80', institute: 'ICM Jhansi', xp: CURRENT_USER_XP, badge: '🥈 2nd' },
        { rank: 3, name: 'Sandeep Gupta', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80', institute: 'ICM Jhansi', xp: 1210, badge: '🥉 3rd' },
        { rank: 4, name: 'Deepak Kumar', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80', institute: 'ICM Jhansi', xp: 1080 },
        { rank: 5, name: 'Anjali Mishra', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80', institute: 'ICM Jhansi', xp: 950 },
      ]);
    }

    // Default: Global (matching Image 5 exactly)
    return sendSuccess(res, [
      { rank: 1, name: 'Priya Sharma', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80', institute: 'VAMNICOM Pune', xp: 2450, badge: '👑 1st' },
      { rank: 2, name: 'Amit Singh', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80', institute: 'RICM Lucknow', xp: 2120, badge: '🥈 2nd' },
      { rank: 3, name: 'Neha Verma', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80', institute: 'ICM Jhansi', xp: 1980, badge: '🥉 3rd' },
      { rank: 4, name: 'Rohit Kumar', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80', institute: 'RICM Patna', xp: 1760 },
      { rank: 5, name: 'Sneha Patel', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80', institute: 'VAMNICOM Pune', xp: 1620 },
      { rank: 6, name: 'Vikash Yadav', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80', institute: 'ICM Lucknow', xp: 1480 },
      { rank: 7, name: 'Pooja Tiwari', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80', institute: 'RICM Bengaluru', xp: 1320 },
      { rank: 8, name: 'Sandeep Gupta', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80', institute: 'ICM Dehradun', xp: 1210 },
      { rank: 9, name: 'Anjali Mishra', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80', institute: 'ICM Bhopal', xp: 1150 },
      { rank: 10, name: 'Deepak Kumar', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80', institute: 'ICM Jaipur', xp: 1080 },
      { rank: 18, name: 'Rahul Sharma (You)', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80', institute: 'ICM Jhansi', xp: CURRENT_USER_XP, badge: '⭐ Rising Star' },
    ]);
  },

  async getMyLeaderboardRank(req, res) {
    return sendSuccess(res, { rank: 18, totalParticipants: 480, xp: 840, percentile: 96.2 });
  },

  async getWeeklyDashboard(req, res) {
    return sendSuccess(res, {
      week: '2026-W40',
      xp: 840,
      goal: 1000,
      streak: 7,
      rank: 18,
      nextLevelXp: 160,
      daily: [
        { day: 'Mon', xp: 20 },
        { day: 'Tue', xp: 80 },
        { day: 'Wed', xp: 100 },
        { day: 'Thu', xp: 150 },
        { day: 'Fri', xp: 120 },
        { day: 'Sat', xp: 170 },
        { day: 'Sun', xp: 200 },
      ],
    });
  },

  async getRewardsCatalog(req, res) {
    return sendSuccess(res, [
      { rewardId: 'REW-01', title: 'NCCT National Merit E-Badge', costXp: 500, claimed: true },
      { rewardId: 'REW-02', title: 'Priority Interview Recommendation Slot', costXp: 1000, claimed: false },
      { rewardId: 'REW-03', title: 'Sponsored Registration for National Dairy Conclave', costXp: 2000, claimed: false },
    ]);
  },

  async claimReward(req, res) {
    return sendSuccess(res, { rewardId: req.params.id, claimed: true, message: 'Reward unlocked and credited to your profile.' });
  },

  async getNotifications(req, res) {
    return sendSuccess(res, [
      { id: 'NOTIF-1', title: 'Digital Finance Workshop Today', body: 'Class commences at 10:30 AM in Room 203, ICM Jhansi.', time: '1 hour ago', read: false },
      { id: 'NOTIF-2', title: 'Application Shortlisted', body: 'Cooperative Bank Ltd. shortlisted your resume for Accounts Assistant.', time: 'Yesterday', read: false },
      { id: 'NOTIF-3', title: 'New Badge Unlocked', body: 'You earned the Consistent Learner 7-day streak badge!', time: '2 days ago', read: true },
    ]);
  },

  async getUnreadNotificationsCount(req, res) {
    return sendSuccess(res, { unreadCount: 3 });
  },

  async markNotificationRead(req, res) {
    return sendSuccess(res, { id: req.params.id, read: true });
  },

  async markAllNotificationsRead(req, res) {
    return sendSuccess(res, { allMarkedRead: true });
  },

  async deleteNotification(req, res) {
    return sendSuccess(res, { id: req.params.id, deleted: true });
  },

  async getNotificationPreferences(req, res) {
    return sendSuccess(res, { push: true, email: true, sms: false, classReminders: true, jobAlerts: true });
  },

  async updateNotificationPreferences(req, res) {
    return sendSuccess(res, { updated: true, preferences: req.body });
  },

  async getDocuments(req, res) {
    return sendSuccess(res, [
      { id: 'DOC-1', name: 'Aadhaar eKYC Verified.pdf', type: 'IDENTITY', size: '1.1 MB', uploadedDate: '2026-08-10' },
      { id: 'DOC-2', name: 'Graduation Degree BCom.pdf', type: 'EDUCATION', size: '2.4 MB', uploadedDate: '2026-08-12' },
    ]);
  },

  async uploadDocument(req, res) {
    return sendSuccess(res, { documentId: `DOC-${Date.now()}`, uploaded: true, name: req.body.name || 'Document.pdf' });
  },

  async getDocumentById(req, res) {
    return sendSuccess(res, { documentId: req.params.id, verified: true, downloadUrl: `/api/v1/learner/documents/${req.params.id}/download` });
  },

  async deleteDocument(req, res) {
    return sendSuccess(res, { documentId: req.params.id, deleted: true });
  },

  async downloadDocument(req, res) {
    return sendSuccess(res, { url: `http://localhost:5000/vault/${req.params.id}` });
  },

  async createSupportTicket(req, res) {
    return sendSuccess(res, {
      ticketId: `TICK-${Date.now().toString().slice(-4)}`,
      subject: req.body.subject || 'Assistance needed',
      status: 'OPEN',
      assignedTo: 'NCCT Student Support Desk',
      createdAt: new Date().toISOString(),
    });
  },

  async getSupportTickets(req, res) {
    return sendSuccess(res, [
      { ticketId: 'TICK-101', subject: 'Hostel Wi-Fi Connectivity in Block B', status: 'RESOLVED', date: '2026-09-15' },
    ]);
  },

  async getSupportTicketById(req, res) {
    return sendSuccess(res, {
      ticketId: req.params.id,
      subject: 'Hostel Wi-Fi Connectivity',
      status: 'RESOLVED',
      resolution: 'Edge Smart Node access point rebooted and bandwidth allocated.',
    });
  },

  async addSupportMessage(req, res) {
    return sendSuccess(res, { messageId: `MSG-${Date.now()}`, sent: true });
  },

  async getSettings(req, res) {
    return sendSuccess(res, {
      theme: 'light',
      language: 'hi_en',
      offlineDataSaver: true,
      autoSyncOnWifi: true,
    });
  },

  async updateSettings(req, res) {
    return sendSuccess(res, { updated: true, settings: req.body });
  },

  async getLanguageSettings(req, res) {
    return sendSuccess(res, {
      currentLanguage: 'hi_en',
      supportedLanguages: [
        { code: 'hi', name: 'Hindi (हिंदी)' },
        { code: 'en', name: 'English' },
        { code: 'mr', name: 'Marathi (मराठी)' },
        { code: 'gu', name: 'Gujarati (ગુજરાતી)' },
        { code: 'ta', name: 'Tamil (தமிழ்)' },
      ],
    });
  },

  async updateLanguageSettings(req, res) {
    return sendSuccess(res, { languageUpdated: true, newLanguage: req.body.languageCode });
  },

  async getPrivacySettings(req, res) {
    return sendSuccess(res, {
      profileVisibleToEmployers: true,
      showOnCommunityLeaderboard: true,
      shareSkillsWithPlacementOfficers: true,
    });
  },

  async updatePrivacySettings(req, res) {
    return sendSuccess(res, { privacyUpdated: true });
  },

  async getStorageSettings(req, res) {
    return sendSuccess(res, {
      usedStorageMb: 142.5,
      offlineLessonsCount: 4,
      offlineQuizzesCount: 2,
    });
  },

  async clearCache(req, res) {
    return sendSuccess(res, { cacheClearedMb: 32.4, remainingStorageMb: 110.1, status: 'CLEAN' });
  },
};
