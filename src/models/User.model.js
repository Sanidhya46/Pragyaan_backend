import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const USER_ROLES = [
  'SUPER_ADMIN',
  'NCCT_HQ_ADMIN',
  'INSTITUTE_DIRECTOR',
  'INSTITUTE_ADMIN',
  'INSTITUTE_ERP_ADMIN',
  'PROGRAMME_COORDINATOR',
  'TRAINER_FACULTY',
  'FACULTY_TRAINER',
  'RESOURCE_PERSON',
  'TRAINEE',
  'ASSESSMENT_OFFICER',
  'PLACEMENT_OFFICER',
  'PLACEMENT_CAREER_OFFICER',
  'CONTENT_LMS_ADMIN',
  'LMS_CONTENT_ADMIN',
  'FINANCE_OPERATIONS',
  'IT_EDGE_OPERATOR',
  'INSTITUTE_IT_EDGE_OPERATOR',
  'NOMINATING_ORGANIZATION_COORDINATOR',
  'PARTNER_COORDINATOR',
  'EMPLOYER_RECRUITER',
];

const userSchema = new mongoose.Schema(
  {
    userId: { type: String, unique: true, required: true },
    name: { type: String, required: true, trim: true },
    firstName: { type: String, trim: true, default: '' },
    lastName: { type: String, trim: true, default: '' },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other', ''], default: 'Male' },
    dob: { type: String, default: '' },
    password: { type: String, required: true },
    role: { type: String, enum: USER_ROLES, default: 'TRAINEE' },
    roleAssignments: [
      {
        application: { type: String, enum: ['LEARNER', 'INSTITUTE_PARTNER', 'NCCT_HQ', 'PUBLIC_VERIFY'], required: true },
        role: { type: String, required: true },
        organizationId: { type: String, default: 'NCCT' },
        instituteIds: [{ type: String }],
        programmeIds: [{ type: String }],
        status: { type: String, default: 'ACTIVE' },
        assignedAt: { type: Date, default: Date.now },
      },
    ],
    instituteId: { type: String, default: 'INST-NCCT-HQ' },
    tokenVersion: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ['ACTIVE', 'PENDING', 'BLOCKED', 'PENDING_APPROVAL', 'PENDING_VERIFICATION', 'REJECTED', 'SUSPENDED'],
      default: 'ACTIVE',
    },
    avatarUrl: { type: String, default: '' },
    profile: {
      designation: { type: String, default: '' },
      qualification: { type: String, default: '' },
      bio: { type: String, default: '' },
      preferredLanguage: { type: String, default: 'English' },
      address: { type: String, default: '' },
      state: { type: String, default: '' },
      city: { type: String, default: '' },
      district: { type: String, default: '' },
    },
    // Partner-specific structured registration details
    partnerDetails: {
      application: { type: String, default: 'INSTITUTE_PARTNER' },
      userRole: { type: String, default: '' },
      organizationType: { type: String, default: '' },
      designation: { type: String, default: '' },
      officialEmail: { type: String, default: '' },
      programmeArea: { type: String, default: '' },
      subjectsOrExpertise: [{ type: String }],
      experience: { type: Number, default: 0 },
      assessmentResponsibilities: [{ type: String }],
      contentDomains: [{ type: String }],
      careerResponsibilities: [{ type: String }],
      technicalResponsibilities: [{ type: String }],
      affiliatedOrganization: { type: String, default: '' },
      organizationName: { type: String, default: '' },
      registrationDetails: { type: String, default: '' },
      industrySector: { type: String, default: '' },
      companyWebsite: { type: String, default: '' },
      organizationAddress: { type: String, default: '' },
      district: { type: String, default: '' },
      activationStatus: {
        type: String,
        enum: ['PENDING_VERIFICATION', 'PENDING_APPROVAL', 'ACTIVE', 'REJECTED', 'SUSPENDED'],
        default: 'PENDING_APPROVAL',
      },
      verificationMethod: { type: String, default: '' },
    },
    // Role-specific extensions
    traineeDetails: {
      registrationNumber: { type: String, default: '' },
      batch: { type: String, default: '' },
      participantCategory: {
        type: String,
        enum: [
          'Cooperative Personnel',
          'Cooperative Member',
          'PACS Member',
          'SHG / JLG Member',
          'Farmer',
          'Rural Youth',
          'Student / Graduate',
          'Other',
          ''
        ],
        default: 'Student / Graduate',
      },
      cooperativeAffiliation: { type: String, default: '' },
      overallProgress: { type: Number, default: 68 },
      attendancePercentage: { type: Number, default: 92 },
      completedCoursesCount: { type: Number, default: 3 },
      certificatesEarnedCount: { type: Number, default: 1 },
      faceEmbedding: { type: [Number], default: [] },
      faceEnrolled: { type: Boolean, default: false },
      faceImageUrl: { type: String, default: '' },
    },
    trainerDetails: {
      specialization: [{ type: String }],
      yearsExperience: { type: Number, default: 0 },
      assignedBatches: [{ type: String }],
      rating: { type: Number, default: 4.8 },
    },
    employerDetails: {
      companyName: { type: String, default: '' },
      industry: { type: String, default: '' },
      website: { type: String, default: '' },
      isVerified: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model('User', userSchema);
