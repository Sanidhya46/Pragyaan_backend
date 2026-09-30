import mongoose from 'mongoose';

// 1. Sahakar Skill Tree Node
const skillTreeNodeSchema = new mongoose.Schema({
  nodeId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  domain: { type: String, required: true },
  tier: { type: Number, default: 1 },
  requiredXp: { type: Number, default: 100 },
  dependencies: [{ type: String }],
  unlockedByDefault: { type: Boolean, default: false },
  description: { type: String },
  icon: { type: String, default: 'Sparkles' },
  coursesLinked: [{ type: String }],
}, { timestamps: true });

// 2. Trainee Gamification & Streaks Profile
const traineeGamificationSchema = new mongoose.Schema({
  traineeId: { type: String, required: true, unique: true },
  name: { type: String, default: 'Rahul Sharma' },
  currentXp: { type: Number, default: 620 },
  level: { type: Number, default: 3 },
  points: { type: Number, default: 1850 },
  streakDays: { type: Number, default: 8 },
  lastActiveDate: { type: Date, default: Date.now },
  unlockedSkills: [{ type: String }],
  badges: [{
    id: { type: String },
    name: { type: String },
    icon: { type: String },
    tier: { type: String },
    description: { type: String },
    awardedAt: { type: Date, default: Date.now }
  }],
  squadId: { type: String, default: 'SQUAD-PUNE-01' }
}, { timestamps: true });

// 3. Cooperative Squad Schema
const cooperativeSquadSchema = new mongoose.Schema({
  squadId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  batchId: { type: String, default: 'BATCH-2025-12A' },
  instituteName: { type: String, default: 'VAMNICOM, Pune' },
  avatar: { type: String, default: '🛡️' },
  motto: { type: String, default: 'Cooperation Through Excellence' },
  weeklyTargetXp: { type: Number, default: 5000 },
  currentWeeklyXp: { type: Number, default: 3950 },
  rank: { type: Number, default: 1 },
  members: [{
    traineeId: { type: String },
    name: { type: String },
    role: { type: String, default: 'Member' },
    xpContributed: { type: Number, default: 200 }
  }]
}, { timestamps: true });

// 4. Gamified Assessments Created by Partner
const gamifiedAssessmentSchema = new mongoose.Schema({
  assessmentId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  creatorName: { type: String, default: 'Prof. R. P. Singh' },
  creatorRole: { type: String, default: 'TRAINER_FACULTY' },
  domain: { type: String, default: 'Cooperative Banking' },
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Intermediate' },
  xpReward: { type: Number, default: 200 },
  pointsReward: { type: Number, default: 500 },
  badgeUnlockId: { type: String },
  skillNodeUnlockId: { type: String },
  timeLimitSeconds: { type: Number, default: 180 },
  questions: [{
    id: { type: String },
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctIndex: { type: Number, required: true },
    explanation: { type: String },
    skillAwarded: { type: String }
  }]
}, { timestamps: true });

// 5. Living Cooperative India Map & Edge Node Telemetry
const instituteNodeSchema = new mongoose.Schema({
  nodeId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  type: { type: String, enum: ['APEX', 'RICM', 'ICM'], default: 'RICM' },
  status: { type: String, enum: ['ONLINE', 'POWER_BACKUP', 'SYNCING', 'OFFLINE'], default: 'ONLINE' },
  batteryPercent: { type: Number, default: 98 },
  syncQueueCount: { type: Number, default: 0 },
  activeTrainees: { type: Number, default: 42 },
  edgeVersion: { type: String, default: 'v2.4.0-edge' },
  ipAddress: { type: String, default: '192.168.1.100' },
  isPluggedIn: { type: Boolean, default: true },
  lastHeartbeat: { type: Date, default: Date.now }
}, { timestamps: true });

// 6. Tamper-Evident Attendance Ledger Block
const tamperLedgerBlockSchema = new mongoose.Schema({
  blockIndex: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  sessionId: { type: String, required: true },
  batchId: { type: String, required: true },
  totalPresent: { type: Number, required: true },
  recordsHash: { type: String, required: true },
  previousHash: { type: String, required: true },
  blockHash: { type: String, required: true },
  verified: { type: Boolean, default: true }
}, { timestamps: true });

export const SkillTreeNode = mongoose.model('SkillTreeNode', skillTreeNodeSchema);
export const TraineeGamification = mongoose.model('TraineeGamification', traineeGamificationSchema);
export const CooperativeSquad = mongoose.model('CooperativeSquad', cooperativeSquadSchema);
export const GamifiedAssessment = mongoose.model('GamifiedAssessment', gamifiedAssessmentSchema);
export const InstituteNode = mongoose.model('InstituteNode', instituteNodeSchema);
export const TamperLedgerBlock = mongoose.model('TamperLedgerBlock', tamperLedgerBlockSchema);
