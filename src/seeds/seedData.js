import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/db.js';
import { Institute } from '../models/Institute.model.js';
import { User } from '../models/User.model.js';
import { Programme } from '../models/Programme.model.js';
import { Batch } from '../models/Batch.model.js';
import { Enrollment } from '../models/Enrollment.model.js';
import { Course, UserProgress } from '../models/Lms.model.js';
import { AttendanceSession, Attendance } from '../models/Attendance.model.js';
import { Assessment, AssessmentAttempt } from '../models/Assessment.model.js';
import { Certificate } from '../models/Certificate.model.js';
import { Skill, TraineeSkill } from '../models/Skill.model.js';
import { Vacancy, JobApplication, EmploymentOutcome } from '../models/Employment.model.js';
import { Device } from '../models/Device.model.js';
import { HostelBlock, HostelAllocation } from '../models/Hostel.model.js';
import { LogisticsTask, Asset } from '../models/Logistics.model.js';
import { Classroom, SessionSchedule } from '../models/Timetable.model.js';
import { ProgrammeBudget } from '../models/Finance.model.js';
import { AuditLog, Notification, Feedback } from '../models/AuditNotification.model.js';

export const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('[Seed] Seeding PRAGYAAN production dataset...');

    // Clear existing collections
    await Promise.all([
      Institute.deleteMany({}),
      User.deleteMany({}),
      Programme.deleteMany({}),
      Batch.deleteMany({}),
      Enrollment.deleteMany({}),
      Course.deleteMany({}),
      UserProgress.deleteMany({}),
      AttendanceSession.deleteMany({}),
      Attendance.deleteMany({}),
      Assessment.deleteMany({}),
      AssessmentAttempt.deleteMany({}),
      Certificate.deleteMany({}),
      Skill.deleteMany({}),
      TraineeSkill.deleteMany({}),
      Vacancy.deleteMany({}),
      JobApplication.deleteMany({}),
      EmploymentOutcome.deleteMany({}),
      Device.deleteMany({}),
      HostelBlock.deleteMany({}),
      HostelAllocation.deleteMany({}),
      LogisticsTask.deleteMany({}),
      Asset.deleteMany({}),
      Classroom.deleteMany({}),
      SessionSchedule.deleteMany({}),
      ProgrammeBudget.deleteMany({}),
      AuditLog.deleteMany({}),
      Notification.deleteMany({}),
      Feedback.deleteMany({}),
    ]);

    // 1. Seed the 20 NCCT Constituent Institutes
    const institutes = [
      { instituteId: 'INST-VAMNICOM', name: 'Vaikunth Mehta National Institute of Cooperative Management (VAMNICOM), Pune', code: 'VAMNICOM-PUN', type: 'NATIONAL_APEX', state: 'Maharashtra', district: 'Pune', participantsTrained: 48732, completionRate: 96, capacity: 1200 },
      { instituteId: 'INST-RICM-JAIPUR', name: 'Regional Institute of Cooperative Management (RICM), Jaipur', code: 'RICM-JAI', type: 'RICM', state: 'Rajasthan', district: 'Jaipur', participantsTrained: 42156, completionRate: 93, capacity: 800 },
      { instituteId: 'INST-ICM-LUCKNOW', name: 'Institute of Cooperative Management (ICM), Lucknow', code: 'ICM-LKO', type: 'ICM', state: 'Uttar Pradesh', district: 'Lucknow', participantsTrained: 38421, completionRate: 90, capacity: 750 },
      { instituteId: 'INST-RICM-GUWAHATI', name: 'Regional Institute of Cooperative Management (RICM), Guwahati', code: 'RICM-GAU', type: 'RICM', state: 'Assam', district: 'Guwahati', participantsTrained: 32780, completionRate: 88, capacity: 600 },
      { instituteId: 'INST-RICM-HYDERABAD', name: 'Regional Institute of Cooperative Management (RICM), Hyderabad', code: 'RICM-HYD', type: 'RICM', state: 'Telangana', district: 'Hyderabad', participantsTrained: 28954, completionRate: 85, capacity: 700 },
      { instituteId: 'INST-RICM-KALYANI', name: 'Regional Institute of Cooperative Management (RICM), Kalyani', code: 'RICM-KAL', type: 'RICM', state: 'West Bengal', district: 'Nadia', participantsTrained: 24500, completionRate: 86, capacity: 650 },
      { instituteId: 'INST-RICM-PATNA', name: 'Regional Institute of Cooperative Management (RICM), Patna', code: 'RICM-PAT', type: 'RICM', state: 'Bihar', district: 'Patna', participantsTrained: 26100, completionRate: 84, capacity: 600 },
      { instituteId: 'INST-RICM-CHANDIGARH', name: 'Regional Institute of Cooperative Management (RICM), Chandigarh', code: 'RICM-CHD', type: 'RICM', state: 'Punjab', district: 'Chandigarh', participantsTrained: 22800, completionRate: 91, capacity: 550 },
      { instituteId: 'INST-ICM-BHOPAL', name: 'Institute of Cooperative Management (ICM), Bhopal', code: 'ICM-BHO', type: 'ICM', state: 'Madhya Pradesh', district: 'Bhopal', participantsTrained: 21300, completionRate: 89, capacity: 500 },
      { instituteId: 'INST-ICM-DEHRADUN', name: 'Institute of Cooperative Management (ICM), Dehradun', code: 'ICM-DDN', type: 'ICM', state: 'Uttarakhand', district: 'Dehradun', participantsTrained: 17800, completionRate: 92, capacity: 450 },
      { instituteId: 'INST-ICM-SHIMLA', name: 'Institute of Cooperative Management (ICM), Shimla', code: 'ICM-SML', type: 'ICM', state: 'Himachal Pradesh', district: 'Shimla', participantsTrained: 14200, completionRate: 94, capacity: 400 },
      { instituteId: 'INST-ICM-TRIVANDRUM', name: 'Institute of Cooperative Management (ICM), Thiruvananthapuram', code: 'ICM-TRV', type: 'ICM', state: 'Kerala', district: 'Thiruvananthapuram', participantsTrained: 19500, completionRate: 95, capacity: 500 },
      { instituteId: 'INST-ICM-MADURAI', name: 'Institute of Cooperative Management (ICM), Madurai', code: 'ICM-MDU', type: 'ICM', state: 'Tamil Nadu', district: 'Madurai', participantsTrained: 18200, completionRate: 87, capacity: 480 },
      { instituteId: 'INST-ICM-CHENNAI', name: 'Institute of Cooperative Management (ICM), Chennai', code: 'ICM-CHE', type: 'ICM', state: 'Tamil Nadu', district: 'Chennai', participantsTrained: 20100, completionRate: 90, capacity: 520 },
      { instituteId: 'INST-ICM-BANGALORE', name: 'Institute of Cooperative Management (ICM), Bangalore', code: 'ICM-BLR', type: 'ICM', state: 'Karnataka', district: 'Bengaluru', participantsTrained: 21900, completionRate: 91, capacity: 550 },
      { instituteId: 'INST-ICM-NAGPUR', name: 'Institute of Cooperative Management (ICM), Nagpur', code: 'ICM-NGP', type: 'ICM', state: 'Maharashtra', district: 'Nagpur', participantsTrained: 16400, completionRate: 88, capacity: 450 },
      { instituteId: 'INST-ICM-GANDHINAGAR', name: 'Institute of Cooperative Management (ICM), Gandhinagar', code: 'ICM-GAN', type: 'ICM', state: 'Gujarat', district: 'Gandhinagar', participantsTrained: 23100, completionRate: 93, capacity: 580 },
      { instituteId: 'INST-ICM-BHUBANESWAR', name: 'Institute of Cooperative Management (ICM), Bhubaneswar', code: 'ICM-BBS', type: 'ICM', state: 'Odisha', district: 'Khurda', participantsTrained: 18900, completionRate: 86, capacity: 500 },
      { instituteId: 'INST-ICM-IMPHAL', name: 'Institute of Cooperative Management (ICM), Imphal', code: 'ICM-IMP', type: 'ICM', state: 'Manipur', district: 'Imphal West', participantsTrained: 11400, completionRate: 82, capacity: 350 },
      { instituteId: 'INST-ICM-RANCHI', name: 'Institute of Cooperative Management (ICM), Ranchi', code: 'ICM-RNC', type: 'ICM', state: 'Jharkhand', district: 'Ranchi', participantsTrained: 15300, completionRate: 85, capacity: 450 },
    ];
    await Institute.insertMany(institutes);
    console.log(`[Seed] 20 NCCT Institutes created.`);

    // 2. Seed Users for All 14 Roles
    const users = [
      { userId: 'USR-00001', name: 'Pragyaan HQ Administrator', email: 'admin@pragyaan.gov.in', password: 'Password@123', role: 'SUPER_ADMIN', instituteId: 'INST-VAMNICOM' },
      { userId: 'USR-00002', name: 'Dr. Ramesh Chandra (HQ Director)', email: 'hq@pragyaan.gov.in', password: 'Password@123', role: 'NCCT_HQ_ADMIN', instituteId: 'INST-VAMNICOM' },
      { userId: 'USR-00003', name: 'Prof. K. S. Deshmukh', email: 'director.vamnicom@pragyaan.gov.in', password: 'Password@123', role: 'INSTITUTE_DIRECTOR', instituteId: 'INST-VAMNICOM' },
      { userId: 'USR-00004', name: 'Sanjay Verma (Operations Admin)', email: 'admin.vamnicom@pragyaan.gov.in', password: 'Password@123', role: 'INSTITUTE_ADMIN', instituteId: 'INST-VAMNICOM' },
      { userId: 'USR-00005', name: 'Anjali Nair (Coordinator)', email: 'coord.vamnicom@pragyaan.gov.in', password: 'Password@123', role: 'PROGRAMME_COORDINATOR', instituteId: 'INST-VAMNICOM' },
      { userId: 'USR-00006', name: 'Prof. R. P. Singh (Faculty)', email: 'trainer.singh@vamnicom.ac.in', password: 'Password@123', role: 'TRAINER_FACULTY', instituteId: 'INST-VAMNICOM' },
      { userId: 'USR-00007', name: 'Dr. Arvind Joshi (Domain Expert)', email: 'expert.coop@pragyaan.gov.in', password: 'Password@123', role: 'RESOURCE_PERSON', instituteId: 'INST-VAMNICOM' },
      // Exact Learner matching Image 2
      {
        userId: 'USR-10001',
        name: 'Rahul Sharma',
        email: 'rahul.sharma@vamnicom.ac.in',
        password: 'Password@123',
        role: 'TRAINEE',
        instituteId: 'INST-VAMNICOM',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        traineeDetails: {
          registrationNumber: 'VAM-2025-TRN-10001',
          batch: 'Batch 2025',
          cooperativeAffiliation: 'Maharashtra State Cooperative Bank (MSCB)',
          overallProgress: 68,
          attendancePercentage: 92,
          completedCoursesCount: 3,
          certificatesEarnedCount: 1,
        },
      },
      { userId: 'USR-00009', name: 'Vandana Tiwari (Assessment Officer)', email: 'exam.officer@pragyaan.gov.in', password: 'Password@123', role: 'ASSESSMENT_OFFICER', instituteId: 'INST-VAMNICOM' },
      { userId: 'USR-00010', name: 'Manoj Kumar (Placement Head)', email: 'placement@vamnicom.ac.in', password: 'Password@123', role: 'PLACEMENT_OFFICER', instituteId: 'INST-VAMNICOM' },
      { userId: 'USR-00011', name: 'Priya Sundaram (LMS Admin)', email: 'lms.admin@pragyaan.gov.in', password: 'Password@123', role: 'CONTENT_LMS_ADMIN', instituteId: 'INST-VAMNICOM' },
      { userId: 'USR-00012', name: 'Amitabh Sen (Finance Head)', email: 'finance@vamnicom.ac.in', password: 'Password@123', role: 'FINANCE_OPERATIONS', instituteId: 'INST-VAMNICOM' },
      { userId: 'USR-00013', name: 'Rajesh Patil (Edge Node Engineer)', email: 'edge.operator@vamnicom.ac.in', password: 'Password@123', role: 'IT_EDGE_OPERATOR', instituteId: 'INST-VAMNICOM' },
      {
        userId: 'USR-00014',
        name: 'Sunita Rao (Lead Recruiter)',
        email: 'recruiter@tataconsultancy.com',
        password: 'Password@123',
        role: 'EMPLOYER_RECRUITER',
        instituteId: 'INST-VAMNICOM',
        employerDetails: {
          companyName: 'Tata Consultancy Services',
          industry: 'IT & Cooperative Solutions',
          website: 'https://tcs.com',
          isVerified: true,
        },
      },
      {
        userId: 'USR-00015',
        name: 'Harish Mehta (IFFCO Liaison)',
        email: 'nominating.iffco@pragyaan.gov.in',
        password: 'Password@123',
        role: 'PARTNER_COORDINATOR',
        instituteId: 'INST-VAMNICOM',
      },
    ];

    for (const u of users) {
      const userDoc = new User(u);
      await userDoc.save();
    }
    console.log(`[Seed] 14 User accounts created.`);

    // 3. Seed Programmes
    const programmes = [
      {
        programmeId: 'PRG-2025-01',
        title: 'Digital Literacy & Office Productivity',
        code: 'DLOP-101',
        category: 'Digital',
        sector: 'Cooperative Banking & Services',
        durationWeeks: 12,
        durationHours: 60,
        deliveryMode: 'BLENDED',
        instituteId: 'INST-VAMNICOM',
        capacity: 60,
        enrolledCount: 58,
        completedCount: 42,
        learningOutcomes: ['Master MS Word, Excel, PowerPoint', 'Cooperative database entries', 'Secure digital communication'],
        mappedSkills: [
          { skillId: 'SK-01', skillName: 'MS Office', targetLevel: 4 },
          { skillId: 'SK-02', skillName: 'Digital Literacy', targetLevel: 4 },
          { skillId: 'SK-03', skillName: 'Communication', targetLevel: 3 },
        ],
        status: 'ACTIVE',
      },
      {
        programmeId: 'PRG-2025-02',
        title: 'Cooperative Management & Leadership',
        code: 'CML-202',
        category: 'Management',
        sector: 'Cooperative Administration',
        durationWeeks: 8,
        durationHours: 48,
        deliveryMode: 'CLASSROOM',
        instituteId: 'INST-VAMNICOM',
        capacity: 50,
        enrolledCount: 45,
        status: 'ACTIVE',
      },
      {
        programmeId: 'PRG-2025-03',
        title: 'Financial Literacy & Digital Banking',
        code: 'FLDB-303',
        category: 'Technical',
        sector: 'Banking & Financial Inclusion',
        durationWeeks: 8,
        durationHours: 40,
        deliveryMode: 'BLENDED',
        instituteId: 'INST-VAMNICOM',
        capacity: 60,
        enrolledCount: 52,
        status: 'ACTIVE',
      },
      {
        programmeId: 'PRG-2025-04',
        title: 'Agriculture Value Chain Management',
        code: 'AVCM-404',
        category: 'Technical',
        sector: 'Agriculture & Rural Credit',
        durationWeeks: 12,
        durationHours: 72,
        deliveryMode: 'RESIDENTIAL',
        instituteId: 'INST-VAMNICOM',
        capacity: 40,
        enrolledCount: 38,
        status: 'PUBLISHED',
      },
    ];
    await Programme.insertMany(programmes);

    // 4. Seed Batch for Rahul Sharma
    const batch = new Batch({
      batchId: 'BATCH-2025-12A',
      batchName: 'Digital Support & Cooperative Management - Batch 12A',
      programmeId: 'PRG-2025-01',
      instituteId: 'INST-VAMNICOM',
      trainerId: 'USR-00006',
      trainerName: 'Prof. R. P. Singh',
      capacity: 50,
      currentEnrollment: 42,
      classroom: {
        roomNumber: 'Smart Lab 102',
        building: 'Computer Complex Block',
        hasSmartNode: true,
        nodeDeviceId: 'EDGE-VAM-01',
      },
      status: 'ACTIVE',
    });
    await batch.save();

    // 5. Seed Enrollment for Rahul Sharma
    const enrollment = new Enrollment({
      enrollmentId: 'ENR-2025-0091',
      traineeId: 'USR-10001',
      traineeName: 'Rahul Sharma',
      traineeEmail: 'rahul.sharma@vamnicom.ac.in',
      programmeId: 'PRG-2025-01',
      programmeTitle: 'Digital Literacy & Office Productivity',
      batchId: 'BATCH-2025-12A',
      instituteId: 'INST-VAMNICOM',
      status: 'ENROLLED',
      learningProgress: 78,
      attendancePercentage: 92,
      assessmentAverage: 62,
      certificateIssued: true,
      certificateId: 'CERT-2025-VAM-0891',
    });
    await enrollment.save();

    // 6. Seed Courses (Matches Image 2 courses)
    const courses = [
      {
        courseId: 'CRS-101',
        programmeId: 'PRG-2025-01',
        title: 'Digital Literacy & Office Productivity',
        category: 'Computer Application',
        durationHours: 40,
        instructorName: 'Prof. R. P. Singh',
        skillsCovered: ['MS Office', 'Digital Literacy', 'Communication'],
        modules: [
          {
            moduleId: 'MOD-01',
            title: 'Module 1: Foundations of Digital Workspaces',
            orderIndex: 1,
            lessons: [
              { lessonId: 'LES-01', title: 'Introduction to Operating Systems & File Organization', durationMinutes: 25, contentType: 'VIDEO' },
              { lessonId: 'LES-02', title: 'Navigating Internet & Government Cooperative Portals', durationMinutes: 30, contentType: 'PDF' },
            ],
          },
          {
            moduleId: 'MOD-02',
            title: 'Module 2: MS Office Suite Mastery',
            orderIndex: 2,
            lessons: [
              { lessonId: 'LES-03', title: 'MS Word: Report Drafting & Formal Notifications', durationMinutes: 35, contentType: 'VIDEO' },
              { lessonId: 'LES-04', title: 'MS Excel: Formulas, Worksheets & Ledger Accounting', durationMinutes: 45, contentType: 'VIDEO' },
            ],
          },
        ],
      },
      {
        courseId: 'CRS-102',
        programmeId: 'PRG-2025-02',
        title: 'Cooperative Management & Leadership',
        category: 'Management',
        durationHours: 32,
        instructorName: 'Prof. K. S. Deshmukh',
        skillsCovered: ['Management', 'Teamwork', 'Communication'],
      },
      {
        courseId: 'CRS-103',
        programmeId: 'PRG-2025-03',
        title: 'Financial Literacy & Digital Banking',
        category: 'Finance',
        durationHours: 30,
        instructorName: 'Dr. Ramesh Chandra',
        skillsCovered: ['Cooperative Accounting', 'Digital Banking'],
      },
      {
        courseId: 'CRS-104',
        programmeId: 'PRG-2025-04',
        title: 'Agriculture Value Chain Management',
        category: 'Agriculture',
        durationHours: 40,
        instructorName: 'Dr. Arvind Joshi',
        skillsCovered: ['Supply Chain', 'Agriculture Planning'],
      },
    ];
    await Course.insertMany(courses);

    // 7. Seed Rahul Sharma's UserProgress (Matching Image 2: 68% progress)
    await UserProgress.create({
      traineeId: 'USR-10001',
      courseId: 'CRS-101',
      completedLessons: ['LES-01', 'LES-02', 'LES-03'],
      progressPercentage: 68,
      lastAccessedLessonId: 'LES-04',
    });

    // 8. Seed Trainee Skills (Matching Image 2: Your Skills widget)
    const traineeSkills = [
      { traineeId: 'USR-10001', skillId: 'SK-01', skillName: 'MS Office', proficiencyScore: 85, level: 4 },
      { traineeId: 'USR-10001', skillId: 'SK-02', skillName: 'Communication', proficiencyScore: 72, level: 3 },
      { traineeId: 'USR-10001', skillId: 'SK-03', skillName: 'Problem Solving', proficiencyScore: 60, level: 3 },
      { traineeId: 'USR-10001', skillId: 'SK-04', skillName: 'Teamwork', proficiencyScore: 55, level: 3 },
      { traineeId: 'USR-10001', skillId: 'SK-05', skillName: 'Digital Literacy', proficiencyScore: 80, level: 4 },
    ];
    await TraineeSkill.insertMany(traineeSkills);

    // 9. Seed Verifiable Digital Certificate for Rahul Sharma
    await Certificate.create({
      certificateId: 'CERT-2025-VAM-0891',
      credentialId: 'CRED-9F4A-82B1-C34E',
      traineeId: 'USR-10001',
      traineeName: 'Rahul Sharma',
      programmeId: 'PRG-2025-01',
      programmeTitle: 'Digital Literacy & Office Productivity',
      instituteId: 'INST-VAMNICOM',
      instituteName: 'VAMNICOM, Pune',
      completionScore: 88,
      skillsCertified: ['MS Office', 'Digital Literacy', 'Communication'],
      digitalSignature: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      qrVerificationUrl: 'http://localhost:3000/verify/CRED-9F4A-82B1-C34E',
      status: 'VALID',
    });

    // 10. Seed Vacancies
    const vacancies = [
      {
        vacancyId: 'VAC-2025-01',
        employerId: 'USR-00014',
        companyName: 'Tata Consultancy Services',
        title: 'Cooperative IT Support Associate',
        sector: 'Information Technology',
        location: 'Pune / Mumbai',
        workMode: 'HYBRID',
        openings: 15,
        minSalary: 28000,
        maxSalary: 38000,
        requiredSkills: ['MS Office', 'Digital Literacy', 'Communication', 'Problem Solving'],
        description: 'Provide operational computer support to primary agricultural cooperative societies (PACS).',
        status: 'OPEN',
      },
      {
        vacancyId: 'VAC-2025-02',
        employerId: 'USR-00014',
        companyName: 'Maharashtra State Cooperative Bank',
        title: 'Junior Accounts & Ledger Assistant',
        sector: 'Banking & Finance',
        location: 'Pune, Maharashtra',
        workMode: 'ONSITE',
        openings: 8,
        minSalary: 30000,
        maxSalary: 45000,
        requiredSkills: ['MS Office', 'Cooperative Accounting', 'Digital Literacy'],
        description: 'Manage cooperative ledger bookkeeping, audit documentation, and customer verification.',
        status: 'OPEN',
      },
    ];
    await Vacancy.insertMany(vacancies);

    // 11. Seed 20 Smart Training Node Edge Devices (1 for each NCCT Institute)
    const devices = institutes.map((inst, index) => ({
      deviceId: `EDGE-STN-${inst.code}`,
      instituteId: inst.instituteId,
      deviceType: 'SMART_TRAINING_NODE',
      roomLocation: index === 0 ? 'Advanced Edge Lab 102' : `Room 10${(index % 5) + 1}`,
      ipAddress: `192.168.${10 + index}.1`,
      softwareVersion: 'v2.4.1-stn-secure',
      storageFreeMb: 420000 + (index * 2500),
      cameraStatus: 'OK',
      qrScannerStatus: 'OK',
      pendingSyncCount: index === 6 || index === 12 ? 3 : 0,
      status: index === 18 ? 'OFFLINE' : 'ONLINE',
      lastHeartbeat: new Date(Date.now() - (index * 1000 * 60)),
    }));
    await Device.insertMany(devices);
    console.log(`[Seed] 20 Smart Training Node Devices created.`);

    // 12. Seed Classrooms & Timetable Sessions (Features 20, 21)
    const classrooms = [
      { classroomId: 'CR-VAM-101', instituteId: 'INST-VAMNICOM', name: 'Dr. V. Kurien Hall (Interactive Lab)', capacity: 45, hasProjector: true, hasComputerLab: true, hasSmartBoard: true },
      { classroomId: 'CR-VAM-102', instituteId: 'INST-VAMNICOM', name: 'Cooperative Banking Simulation Room', capacity: 35, hasProjector: true, hasComputerLab: true, hasSmartBoard: true },
      { classroomId: 'CR-VAM-201', instituteId: 'INST-VAMNICOM', name: 'Sardar Patel Conference Theater', capacity: 120, hasProjector: true, hasComputerLab: false, hasSmartBoard: true },
    ];
    await Classroom.insertMany(classrooms);

    const sessions = [
      {
        sessionId: 'SES-001',
        instituteId: 'INST-VAMNICOM',
        programmeId: 'PRG-2025-01',
        batchId: 'BATCH-VAM-01',
        classroomId: 'CR-VAM-101',
        trainerId: 'USR-00006',
        topic: 'Double Entry System in Credit Cooperatives',
        date: '2026-09-29',
        startTime: '10:00',
        endTime: '12:00',
        sessionType: 'LECTURE',
        status: 'SCHEDULED'
      },
      {
        sessionId: 'SES-002',
        instituteId: 'INST-VAMNICOM',
        programmeId: 'PRG-2025-01',
        batchId: 'BATCH-VAM-01',
        classroomId: 'CR-VAM-102',
        trainerId: 'USR-00006',
        topic: 'Hands-on Tally & PACS Ledger Reconciliation',
        date: '2026-09-29',
        startTime: '14:00',
        endTime: '16:30',
        sessionType: 'PRACTICAL_LAB',
        status: 'SCHEDULED'
      }
    ];
    await SessionSchedule.insertMany(sessions);

    // 13. Seed Hostel Blocks & Sample Allocation (Feature 22)
    const hostelBlocks = [
      {
        blockId: 'HB-VAM-A',
        instituteId: 'INST-VAMNICOM',
        name: 'Ganga Trainee Residency (Block A)',
        gender: 'MALE',
        totalCapacity: 80,
        totalOccupancy: 42,
        rooms: [
          { roomId: 'RM-A-101', roomNumber: '101', floor: 1, capacity: 2, occupiedBeds: 2, type: 'AC', status: 'FULL' },
          { roomId: 'RM-A-102', roomNumber: '102', floor: 1, capacity: 2, occupiedBeds: 1, type: 'NON_AC', status: 'AVAILABLE' },
          { roomId: 'RM-A-103', roomNumber: '103', floor: 1, capacity: 2, occupiedBeds: 0, type: 'AC', status: 'AVAILABLE' }
        ]
      },
      {
        blockId: 'HB-VAM-B',
        instituteId: 'INST-VAMNICOM',
        name: 'Yamuna Women Scholars Hall (Block B)',
        gender: 'FEMALE',
        totalCapacity: 60,
        totalOccupancy: 28,
        rooms: [
          { roomId: 'RM-B-101', roomNumber: '101', floor: 1, capacity: 2, occupiedBeds: 1, type: 'AC', status: 'AVAILABLE' },
          { roomId: 'RM-B-102', roomNumber: '102', floor: 1, capacity: 2, occupiedBeds: 0, type: 'AC', status: 'AVAILABLE' }
        ]
      }
    ];
    await HostelBlock.insertMany(hostelBlocks);

    await HostelAllocation.create({
      allocationId: 'ALC-VAM-001',
      instituteId: 'INST-VAMNICOM',
      traineeId: 'USR-00008',
      traineeName: 'Rahul Sharma',
      programmeId: 'PRG-2025-01',
      batchId: 'BATCH-VAM-01',
      blockId: 'HB-VAM-A',
      roomId: 'RM-A-101',
      bedNumber: 'Bed-1',
      checkInDate: new Date('2026-09-20'),
      status: 'CHECKED_IN',
      remarks: 'Vegetarian mess preference registered'
    });

    // 14. Seed Training Logistics Tasks & Assets (Features 23, 83)
    const logistics = [
      {
        taskId: 'LOG-001',
        instituteId: 'INST-VAMNICOM',
        programmeId: 'PRG-2025-01',
        batchId: 'BATCH-VAM-01',
        category: 'TRAINING_KITS',
        description: 'Prepare 40 NCCT Welcome Folders with Handbook and USB drives',
        quantityRequired: 40,
        status: 'READY',
        costEstimate: 12000
      },
      {
        taskId: 'LOG-002',
        instituteId: 'INST-VAMNICOM',
        programmeId: 'PRG-2025-01',
        batchId: 'BATCH-VAM-01',
        category: 'FOOD_CATERING',
        description: 'Provide lunch & refreshments for 40 trainees + 4 faculty during workshop',
        quantityRequired: 44,
        status: 'IN_PROGRESS',
        costEstimate: 26400
      },
      {
        taskId: 'LOG-003',
        instituteId: 'INST-VAMNICOM',
        programmeId: 'PRG-2025-01',
        batchId: 'BATCH-VAM-01',
        category: 'CLASSROOM_EQUIPMENT',
        description: 'Calibrate biometric attendance camera and verify offline sync gateway',
        quantityRequired: 1,
        status: 'COMPLETED',
        costEstimate: 0
      }
    ];
    await LogisticsTask.insertMany(logistics);

    const assets = [
      { assetId: 'AST-EDGE-01', instituteId: 'INST-VAMNICOM', name: 'Smart Training Node Core Server', category: 'SMART_EDGE_NODE', serialNumber: 'STN-VAM-9812-A', location: 'Lab 102', status: 'OPERATIONAL' },
      { assetId: 'AST-CAM-01', instituteId: 'INST-VAMNICOM', name: 'AI Face Attendance Camera Terminal', category: 'BIOMETRIC_CAMERA', serialNumber: 'CAM-VAM-4411', location: 'Lab 102 Entrance', status: 'OPERATIONAL' },
      { assetId: 'AST-SCN-01', instituteId: 'INST-VAMNICOM', name: 'High-speed 2D QR Barcode Scanner', category: 'QR_SCANNER', serialNumber: 'SCN-VAM-0091', location: 'Trainer Podium', status: 'OPERATIONAL' },
      { assetId: 'AST-PRJ-01', instituteId: 'INST-VAMNICOM', name: 'Laser 4K Interactive Projector', category: 'PROJECTOR', serialNumber: 'PRJ-VAM-7732', location: 'Auditorium', status: 'OPERATIONAL' },
    ];
    await Asset.insertMany(assets);

    // 15. Seed Programme Budget & Grant Tracking (Feature 81)
    await ProgrammeBudget.create({
      budgetId: 'BDG-2025-VAM-01',
      programmeId: 'PRG-2025-01',
      instituteId: 'INST-VAMNICOM',
      financialYear: '2025-2026',
      schemeName: 'NCCT National PACS Human Capital Development Grant',
      allocatedBudget: 450000,
      approvedExpenditure: 320000,
      actualExpenditure: 285400,
      grantReceived: 450000,
      utilizationPercentage: 63.4,
      status: 'APPROVED',
      expenses: [
        { expenseId: 'EXP-01', category: 'FACULTY_HONORARIUM', amount: 80000, invoiceRef: 'INV-NCCT-881', approvedBy: 'Finance Officer' },
        { expenseId: 'EXP-02', category: 'STUDY_MATERIAL', amount: 45000, invoiceRef: 'INV-PUB-202', approvedBy: 'Finance Officer' },
        { expenseId: 'EXP-03', category: 'CATERING', amount: 95400, invoiceRef: 'INV-CAT-551', approvedBy: 'Operations Desk' },
        { expenseId: 'EXP-04', category: 'HARDWARE_EDGE', amount: 65000, invoiceRef: 'INV-TECH-101', approvedBy: 'IT Officer' },
      ]
    });

    // 16. Seed Notifications, Audit Log, and Feedback (Features 59, 61, 77)
    await Notification.create({
      notificationId: 'NOTIF-001',
      recipientId: 'USR-00008',
      recipientRole: 'TRAINEE',
      title: 'Upcoming Session: Double Entry Accounting',
      message: 'Your lecture starts at 10:00 AM tomorrow in Dr. V. Kurien Hall. Please ensure your QR token is ready.',
      channel: 'IN_APP',
      category: 'SESSION_REMINDER',
      isRead: false
    });

    await AuditLog.create({
      logId: 'AUD-001',
      actorId: 'USR-00001',
      actorName: 'NCCT Super Administrator',
      actorRole: 'SUPER_ADMIN',
      instituteId: 'INST-NCCT-HQ',
      action: 'PROGRAMME_APPROVED',
      entityType: 'Programme',
      entityId: 'PRG-2025-01',
      newState: { status: 'PUBLISHED' },
      reason: 'Statutory NCCT annual calendar curriculum review cleared.'
    });

    await Feedback.create({
      feedbackId: 'FB-001',
      programmeId: 'PRG-2025-01',
      batchId: 'BATCH-VAM-01',
      traineeId: 'USR-00008',
      trainerRating: 5,
      contentRating: 5,
      facilityRating: 4,
      overallExperience: 5,
      comments: 'The practical simulation on cooperative tally was extremely informative and applicable to our village PACS.',
      suggestedImprovements: 'Would appreciate additional offline video modules for GST compliance.'
    });

    console.log('[Seed] PRAGYAAN production dataset seeded successfully into MongoDB Atlas!');
  } catch (err) {
    console.error('[Seed Error]:', err);
  } finally {
    process.exit(0);
  }
};

seedDatabase();
