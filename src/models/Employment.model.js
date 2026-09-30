import mongoose from 'mongoose';

const vacancySchema = new mongoose.Schema(
  {
    vacancyId: { type: String, unique: true, required: true },
    employerId: { type: String, required: true },
    companyName: { type: String, required: true },
    title: { type: String, required: true },
    sector: { type: String, default: 'Cooperative Banking & Services' },
    location: { type: String, required: true },
    workMode: { type: String, enum: ['ONSITE', 'HYBRID', 'REMOTE'], default: 'ONSITE' },
    employmentType: { type: String, enum: ['FULL_TIME', 'INTERNSHIP', 'CONTRACT'], default: 'FULL_TIME' },
    openings: { type: Number, default: 5 },
    minSalary: { type: Number, default: 25000 },
    maxSalary: { type: Number, default: 45000 },
    requiredSkills: [{ type: String }],
    description: { type: String, default: '' },
    eligibility: { type: String, default: 'Completed NCCT Recognized Certificate' },
    deadline: { type: Date },
    status: { type: String, enum: ['OPEN', 'REVIEWING', 'FILLED', 'CLOSED'], default: 'OPEN' },
  },
  { timestamps: true }
);

export const Vacancy = mongoose.model('Vacancy', vacancySchema);

const jobApplicationSchema = new mongoose.Schema(
  {
    applicationId: { type: String, unique: true, required: true },
    vacancyId: { type: String, required: true },
    traineeId: { type: String, required: true },
    traineeName: { type: String, required: true },
    traineeEmail: { type: String, required: true },
    matchPercentage: { type: Number, default: 85 },
    matchedSkills: [{ type: String }],
    missingSkills: [{ type: String }],
    status: {
      type: String,
      enum: ['APPLIED', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED', 'JOINED'],
      default: 'APPLIED',
    },
    interviewDate: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);
jobApplicationSchema.index({ vacancyId: 1, traineeId: 1 }, { unique: true });

export const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);

const employmentOutcomeSchema = new mongoose.Schema(
  {
    outcomeId: { type: String, unique: true, required: true },
    traineeId: { type: String, required: true },
    traineeName: { type: String, required: true },
    employerId: { type: String, required: true },
    employerName: { type: String, required: true },
    vacancyId: { type: String },
    programmeId: { type: String, required: true },
    instituteId: { type: String, required: true },
    employmentType: {
      type: String,
      enum: ['PLACED', 'INTERNSHIP', 'SELF_EMPLOYMENT', 'HIGHER_EDUCATION'],
      default: 'PLACED',
    },
    roleTitle: { type: String, default: 'Cooperative Banking Assistant' },
    monthlySalary: { type: Number, default: 30000 },
    joinedDate: { type: Date, default: Date.now },
    verified: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const EmploymentOutcome = mongoose.model('EmploymentOutcome', employmentOutcomeSchema);
