import mongoose from 'mongoose';
import {
  SkillTreeNode,
  TraineeGamification,
  CooperativeSquad,
  GamifiedAssessment,
} from '../models/Gamification.model.js';
import { successResponse, errorResponse } from '../utils/response.util.js';

const DEFAULT_SKILL_NODES = [
  {
    nodeId: 'SKILL-FND-01',
    name: 'Cooperative Principles & Governance',
    domain: 'Foundation',
    tier: 1,
    requiredXp: 0,
    dependencies: [],
    unlockedByDefault: true,
    description: 'Foundational understanding of the 7 Rochdale cooperative principles, ICA guidelines, and MSCS Act 2002.',
    icon: 'BookOpen',
    coursesLinked: ['CRS-101'],
  },
  {
    nodeId: 'SKILL-PACS-02',
    name: 'PACS Computerization & Ledger Entry',
    domain: 'PACS ERP',
    tier: 2,
    requiredXp: 200,
    dependencies: ['SKILL-FND-01'],
    unlockedByDefault: false,
    description: 'National PACS Computerization ERP workflow, Day-Book entry, member share register, and loan sanctioning.',
    icon: 'HardDrive',
    coursesLinked: ['CRS-102'],
  },
  {
    nodeId: 'SKILL-BNK-03',
    name: 'DCCB Credit Management & Risk Analysis',
    domain: 'Banking & Credit',
    tier: 3,
    requiredXp: 500,
    dependencies: ['SKILL-PACS-02'],
    unlockedByDefault: false,
    description: 'Rural banking operations, credit appraisal, NPA recovery procedures, and NABARD compliance standards.',
    icon: 'TrendingUp',
    coursesLinked: ['CRS-103'],
  },
  {
    nodeId: 'SKILL-AUD-04',
    name: 'Statutory Auditing & GST Compliance',
    domain: 'Audit & Compliance',
    tier: 4,
    requiredXp: 900,
    dependencies: ['SKILL-BNK-03'],
    unlockedByDefault: false,
    description: 'Statutory audit preparation, cooperative ledger reconciliation, GST return filing, and trial balance verification.',
    icon: 'ShieldCheck',
    coursesLinked: ['CRS-104'],
  },
  {
    nodeId: 'SKILL-FPO-05',
    name: 'FPO Leadership & Agro Value Chains',
    domain: 'Leadership',
    tier: 5,
    requiredXp: 1400,
    dependencies: ['SKILL-AUD-04'],
    unlockedByDefault: false,
    description: 'Farmer Producer Organization strategic management, supply chain cold storage contracts, and export marketing.',
    icon: 'Award',
    coursesLinked: ['CRS-105'],
  },
];

const DEFAULT_SQUADS = [
  {
    squadId: 'SQUAD-PUNE-01',
    name: 'Pune Sahakar Pioneers',
    batchId: 'BATCH-2025-12A',
    instituteName: 'VAMNICOM, Pune',
    avatar: '🛡️',
    motto: 'Leadership Through Cooperative Knowledge',
    weeklyTargetXp: 5000,
    currentWeeklyXp: 4150,
    rank: 1,
    members: [
      { traineeId: 'USR-10001', name: 'Rahul Sharma', role: 'Squad Captain', xpContributed: 820 },
      { traineeId: 'USR-10002', name: 'Pooja Verma', role: 'Audit Specialist', xpContributed: 640 },
      { traineeId: 'USR-10003', name: 'Anil Jadhav', role: 'ERP Lead', xpContributed: 590 },
      { traineeId: 'USR-10004', name: 'Sneha Kulkarni', role: 'Member', xpContributed: 510 },
      { traineeId: 'USR-10005', name: 'Vikram Shinde', role: 'Member', xpContributed: 420 },
    ],
  },
  {
    squadId: 'SQUAD-JAIPUR-02',
    name: 'Jaipur Agro Credit Champions',
    batchId: 'BATCH-2025-14B',
    instituteName: 'RICM Jaipur',
    avatar: '🌾',
    motto: 'Empowering PACS Across Rajasthan',
    weeklyTargetXp: 5000,
    currentWeeklyXp: 3820,
    rank: 2,
    members: [
      { traineeId: 'USR-10006', name: 'Mahesh Meena', role: 'Squad Captain', xpContributed: 780 },
      { traineeId: 'USR-10007', name: 'Sunita Rathore', role: 'Member', xpContributed: 610 },
      { traineeId: 'USR-10008', name: 'Kavita Sharma', role: 'Member', xpContributed: 540 },
    ],
  },
  {
    squadId: 'SQUAD-BENGALURU-03',
    name: 'Bengaluru Tech Sahakari',
    batchId: 'BATCH-2025-08C',
    instituteName: 'RICM Bengaluru',
    avatar: '⚡',
    motto: 'Digital Transformation in Cooperatives',
    weeklyTargetXp: 5000,
    currentWeeklyXp: 3410,
    rank: 3,
    members: [
      { traineeId: 'USR-10009', name: 'Girish Kumar', role: 'Squad Captain', xpContributed: 720 },
      { traineeId: 'USR-10010', name: 'Deepa Nayak', role: 'Member', xpContributed: 580 },
    ],
  },
];

const DEFAULT_ASSESSMENTS = [
  {
    assessmentId: 'QUIZ-PACS-101',
    title: 'PACS Computerization & ERP Challenge',
    creatorName: 'Prof. R. P. Singh',
    creatorRole: 'TRAINER_FACULTY',
    domain: 'PACS ERP',
    difficulty: 'Intermediate',
    xpReward: 250,
    pointsReward: 600,
    badgeUnlockId: 'BADGE-PACS-PRO',
    skillNodeUnlockId: 'SKILL-PACS-02',
    timeLimitSeconds: 180,
    questions: [
      {
        id: 'Q1',
        question: 'Under the National PACS Computerization Project, what is the primary role of the Common Accounting System (CAS)?',
        options: [
          'Standardizing chart of accounts and trial balance reporting across all state PACS',
          'Replacing commercial bank core banking solutions completely',
          'Eliminating the requirement for annual statutory audits',
          'Restricting credit to only sugar cooperative factories'
        ],
        correctIndex: 0,
        explanation: 'CAS standardizes the chart of accounts, making financial statements uniform and NABARD-auditable nationwide.',
        skillAwarded: 'PACS Accounting'
      },
      {
        id: 'Q2',
        question: 'Which statutory register must be updated immediately upon member loan disbursement in PACS ERP?',
        options: [
          'Dead Stock Register',
          'Member Loan Ledger & Day Book',
          'Visitor Log Register',
          'Diesel Consumption Book'
        ],
        correctIndex: 1,
        explanation: 'The Member Loan Ledger and Day Book record the debit entry, loan account number, and interest schedule.',
        skillAwarded: 'Ledger Entry'
      },
      {
        id: 'Q3',
        question: 'What is the minimum voting quorum required under the Model Bye-Laws for PACS Annual General Meetings?',
        options: [
          '5 members only',
          'One-fifth of total active members or 50 members, whichever is less',
          '100% attendance of all registered villagers',
          'No quorum required if the Chairman is present'
        ],
        correctIndex: 1,
        explanation: 'Model Bye-Laws stipulate one-fifth of active voting members or 50 members to ensure democratic participation.',
        skillAwarded: 'Cooperative Governance'
      },
      {
        id: 'Q4',
        question: 'When reconciling the PACS Bank Account with the District Central Cooperative Bank (DCCB), what document is generated?',
        options: [
          'Bank Reconciliation Statement (BRS)',
          'Agricultural Land Record (7/12 Extract)',
          'Fertilizer Subsidy Voucher',
          'Trainee Attendance Certificate'
        ],
        correctIndex: 0,
        explanation: 'A Bank Reconciliation Statement (BRS) explains the variance between the cash book balance and the bank passbook balance.',
        skillAwarded: 'Audit Reconciliation'
      }
    ]
  },
  {
    assessmentId: 'QUIZ-BNK-201',
    title: 'Cooperative Banking & Credit Appraisal Arena',
    creatorName: 'Dr. Alok Verma',
    creatorRole: 'TRAINER_FACULTY',
    domain: 'Banking & Credit',
    difficulty: 'Advanced',
    xpReward: 350,
    pointsReward: 800,
    badgeUnlockId: 'BADGE-CREDIT-MASTER',
    skillNodeUnlockId: 'SKILL-BNK-03',
    timeLimitSeconds: 240,
    questions: [
      {
        id: 'Q1',
        question: 'What is the primary indicator used by DCCBs to categorize an agricultural loan as a Non-Performing Asset (NPA)?',
        options: [
          'Principal or interest installment remaining overdue for two crop seasons for short-duration crops',
          'Farmer changing their mobile phone number',
          'Delay of more than 5 days in fertilizer procurement',
          'Loan disbursed during the monsoon season'
        ],
        correctIndex: 0,
        explanation: 'Per RBI/NABARD prudential norms, an agricultural loan is overdue for two crop seasons for short duration crops.',
        skillAwarded: 'Credit Risk Analysis'
      },
      {
        id: 'Q2',
        question: 'Under the KCC (Kisan Credit Card) scheme, what is the maximum interest subvention available for prompt repayment?',
        options: [
          '1% per annum',
          '3% per annum (effective interest rate drops to 4%)',
          '10% per annum',
          'No subvention for prompt repayment'
        ],
        correctIndex: 1,
        explanation: 'Prompt repayment subvention of 3% makes the effective interest rate 4% per annum for credit up to ₹3 Lakhs.',
        skillAwarded: 'Cooperative Banking'
      }
    ]
  }
];

export const gamificationController = {
  // 1. Get full Sahakar Skill Tree for trainee
  async getSkillTree(req, res) {
    try {
      const traineeId = req.params.traineeId || req.query.traineeId || 'USR-10001';

      // Ensure default nodes exist
      const existingCount = await SkillTreeNode.countDocuments();
      if (existingCount === 0) {
        await SkillTreeNode.insertMany(DEFAULT_SKILL_NODES);
      }

      const allNodes = await SkillTreeNode.find().sort({ tier: 1 }).lean();

      // Find or create Trainee Profile
      let traineeProfile = await TraineeGamification.findOne({ traineeId });
      if (!traineeProfile) {
        traineeProfile = await TraineeGamification.create({
          traineeId,
          name: 'Rahul Sharma',
          currentXp: 620,
          level: 3,
          points: 1850,
          streakDays: 8,
          unlockedSkills: ['SKILL-FND-01', 'SKILL-PACS-02'],
          badges: [
            { id: 'BADGE-STREAK-7', name: '7-Day Cooperative Streak', icon: '🔥', tier: 'Bronze', awardedAt: new Date() },
            { id: 'BADGE-PACS-PRO', name: 'PACS ERP Certified Specialist', icon: '⚡', tier: 'Silver', awardedAt: new Date() },
          ],
        });
      }

      // Map unlock status onto each node
      const nodesWithStatus = allNodes.map((node) => {
        const isUnlocked = traineeProfile.unlockedSkills.includes(node.nodeId) || node.unlockedByDefault;
        const canUnlock = !isUnlocked && traineeProfile.currentXp >= node.requiredXp;
        return {
          ...node,
          isUnlocked,
          canUnlock,
        };
      });

      return res.json(
        successResponse({
          trainee: {
            traineeId: traineeProfile.traineeId,
            name: traineeProfile.name,
            currentXp: traineeProfile.currentXp,
            level: traineeProfile.level,
            points: traineeProfile.points,
            streakDays: traineeProfile.streakDays,
            badges: traineeProfile.badges,
            squadId: traineeProfile.squadId,
          },
          nodes: nodesWithStatus,
          totalNodes: allNodes.length,
          unlockedCount: traineeProfile.unlockedSkills.length,
        })
      );
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },

  // 2. Get Streaks & Verified Badges
  async getStreaksAndBadges(req, res) {
    try {
      const traineeId = req.params.traineeId || 'USR-10001';
      let profile = await TraineeGamification.findOne({ traineeId });
      if (!profile) {
        profile = {
          traineeId,
          streakDays: 8,
          currentXp: 620,
          level: 3,
          points: 1850,
          badges: [
            { id: 'BADGE-STREAK-7', name: '7-Day Cooperative Streak', icon: '🔥', tier: 'Bronze' },
            { id: 'BADGE-PACS-PRO', name: 'PACS ERP Specialist', icon: '⚡', tier: 'Silver' },
          ],
        };
      }

      const allAvailableBadges = [
        { id: 'BADGE-STREAK-7', name: '7-Day Streak', icon: '🔥', tier: 'Bronze', description: 'Log in and study 7 consecutive days' },
        { id: 'BADGE-PACS-PRO', name: 'PACS ERP Specialist', icon: '⚡', tier: 'Silver', description: 'Score >90% on PACS ERP Challenge' },
        { id: 'BADGE-CREDIT-MASTER', name: 'Credit Appraisal Master', icon: '🛡️', tier: 'Gold', description: 'Complete DCCB Credit Assessment' },
        { id: 'BADGE-SQUAD-MVP', name: 'Squad MVP Contributor', icon: '👑', tier: 'Platinum', description: 'Top XP contributor in your Cooperative Squad' },
      ];

      return res.json(
        successResponse({
          currentStreak: profile.streakDays,
          currentXp: profile.currentXp,
          points: profile.points,
          level: profile.level,
          earnedBadges: profile.badges,
          availableBadges: allAvailableBadges,
        })
      );
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },

  // 3. Get Cooperative Squads Leaderboard & Details
  async getSquads(req, res) {
    try {
      const existing = await CooperativeSquad.countDocuments();
      if (existing === 0) {
        await CooperativeSquad.insertMany(DEFAULT_SQUADS);
      }

      const squads = await CooperativeSquad.find().sort({ currentWeeklyXp: -1 }).lean();
      return res.json(
        successResponse({
          count: squads.length,
          squads,
        })
      );
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },

  // 4. Join / Switch Cooperative Squad
  async joinSquad(req, res) {
    try {
      const { squadId, traineeId = 'USR-10001', traineeName = 'Rahul Sharma' } = req.body;
      const squad = await CooperativeSquad.findOne({ squadId });
      if (!squad) {
        return res.status(404).json(errorResponse('Squad not found', 'NOT_FOUND'));
      }

      const isMember = squad.members.some((m) => m.traineeId === traineeId);
      if (!isMember) {
        squad.members.push({ traineeId, name: traineeName, role: 'Member', xpContributed: 50 });
        squad.currentWeeklyXp += 50;
        await squad.save();
      }

      await TraineeGamification.findOneAndUpdate(
        { traineeId },
        { $set: { squadId } },
        { upsert: true }
      );

      return res.json(successResponse(squad, `Successfully joined ${squad.name}`));
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },

  // 5. Get Gamified Assessments Available (sent by Partner)
  async getAssessments(req, res) {
    try {
      const existing = await GamifiedAssessment.countDocuments();
      if (existing === 0) {
        await GamifiedAssessment.insertMany(DEFAULT_ASSESSMENTS);
      }

      const assessments = await GamifiedAssessment.find().sort({ createdAt: -1 }).lean();
      return res.json(successResponse(assessments, 'Assessments retrieved'));
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },

  // 6. Partner Creates & Dispatches Gamified Assessment
  async createAssessment(req, res) {
    try {
      const {
        title,
        creatorName = 'Prof. R. P. Singh',
        creatorRole = 'TRAINER_FACULTY',
        domain = 'PACS ERP',
        difficulty = 'Intermediate',
        xpReward = 200,
        pointsReward = 500,
        questions = [],
        badgeUnlockId,
        skillNodeUnlockId,
      } = req.body;

      if (!title || !questions.length) {
        return res.status(400).json(errorResponse('Title and questions array are required'));
      }

      const assessmentId = `QUIZ-${Date.now().toString().slice(-6)}`;
      const quiz = new GamifiedAssessment({
        assessmentId,
        title,
        creatorName,
        creatorRole,
        domain,
        difficulty,
        xpReward,
        pointsReward,
        badgeUnlockId,
        skillNodeUnlockId,
        questions,
      });

      await quiz.save();
      return res.status(201).json(successResponse(quiz, 'Gamified assessment successfully published to Trainee Game Arena'));
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },

  // 7. Trainee Submits Assessment -> Calculates Score, Awards XP/Points, Advances Skill Tree, Updates Squad
  async submitAssessmentAttempt(req, res) {
    try {
      const {
        assessmentId,
        traineeId = 'USR-10001',
        answers = [], // [{ questionId, selectedIndex }]
        timeTakenSeconds = 45,
      } = req.body;

      const query = mongoose.Types.ObjectId.isValid(assessmentId)
        ? { $or: [{ assessmentId }, { _id: assessmentId }] }
        : { assessmentId };
      const quiz = await GamifiedAssessment.findOne(query);
      if (!quiz) {
        return res.status(404).json(errorResponse('Assessment not found', 'NOT_FOUND'));
      }

      let correctCount = 0;
      const questionResults = quiz.questions.map((q) => {
        const userAnswer = answers.find((a) => a.questionId === q.id || a.id === q.id);
        const userSelectedIndex = userAnswer
          ? (userAnswer.selectedIndex !== undefined
              ? userAnswer.selectedIndex
              : (userAnswer.selectedOption !== undefined ? userAnswer.selectedOption : -1))
          : -1;
        const isCorrect = userSelectedIndex === q.correctIndex;
        if (isCorrect) correctCount++;
        return {
          questionId: q.id,
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          userSelectedIndex,
          isCorrect,
          explanation: q.explanation,
        };
      });

      const totalQuestions = quiz.questions.length;
      const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
      const passed = scorePercentage >= 60;

      // Calculate XP & Points earned
      const earnedXp = passed ? Math.round((scorePercentage / 100) * quiz.xpReward) : Math.round(quiz.xpReward * 0.25);
      const earnedPoints = passed ? Math.round((scorePercentage / 100) * quiz.pointsReward) : 100;

      // Update Trainee Gamification Profile
      let trainee = await TraineeGamification.findOne({ traineeId });
      if (!trainee) {
        trainee = await TraineeGamification.create({
          traineeId,
          name: 'Rahul Sharma',
          currentXp: 620,
          level: 3,
          points: 1850,
          streakDays: 8,
          unlockedSkills: ['SKILL-FND-01'],
        });
      }

      trainee.currentXp += earnedXp;
      trainee.points += earnedPoints;
      trainee.streakDays += 1;
      trainee.lastActiveDate = new Date();

      // Check level up (every 500 XP)
      const newLevel = Math.floor(trainee.currentXp / 500) + 1;
      const leveledUp = newLevel > trainee.level;
      trainee.level = newLevel;

      // Check Skill Node unlock
      let unlockedSkillNode = null;
      if (passed && quiz.skillNodeUnlockId && !trainee.unlockedSkills.includes(quiz.skillNodeUnlockId)) {
        trainee.unlockedSkills.push(quiz.skillNodeUnlockId);
        unlockedSkillNode = quiz.skillNodeUnlockId;
      }

      // Check Badge unlock
      let newlyAwardedBadge = null;
      if (passed && quiz.badgeUnlockId) {
        const hasBadge = trainee.badges.some((b) => b.id === quiz.badgeUnlockId);
        if (!hasBadge) {
          newlyAwardedBadge = {
            id: quiz.badgeUnlockId,
            name: `${quiz.title} Finisher`,
            icon: '🏆',
            tier: 'Gold',
            description: `Achieved ${scorePercentage}% on ${quiz.title}`,
            awardedAt: new Date(),
          };
          trainee.badges.push(newlyAwardedBadge);
        }
      }

      await trainee.save();

      // Update Cooperative Squad Score
      if (trainee.squadId) {
        const squad = await CooperativeSquad.findOne({ squadId: trainee.squadId });
        if (squad) {
          squad.currentWeeklyXp += earnedXp;
          const member = squad.members.find((m) => m.traineeId === traineeId);
          if (member) {
            member.xpContributed += earnedXp;
          }
          await squad.save();
        }
      }

      return res.json(
        successResponse({
          score: correctCount,
          totalQuestions,
          scorePercentage,
          passed,
          earnedXp,
          earnedPoints,
          leveledUp,
          newLevel: trainee.level,
          totalXp: trainee.currentXp,
          streakDays: trainee.streakDays,
          unlockedSkillNode,
          newlyAwardedBadge,
          results: questionResults,
          timeTakenSeconds,
        }, `Assessment complete! Scored ${scorePercentage}% (${correctCount}/${totalQuestions})`)
      );
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },
};
