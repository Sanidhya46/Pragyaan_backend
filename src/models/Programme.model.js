import mongoose from 'mongoose';

const programmeSchema = new mongoose.Schema(
  {
    programmeId: { type: String, unique: true, required: true },
    title: { type: String, required: true },
    code: { type: String, required: true },
    category: { type: String, enum: ['Technical', 'Digital', 'Communication', 'Management', 'Soft Skills', 'Cooperative Banking'], default: 'Digital' },
    description: { type: String, default: '' },
    sector: { type: String, default: 'Cooperative' },
    accessType: { type: String, enum: ['FREE', 'PAID'], default: 'FREE' },
    price: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    durationWeeks: { type: Number, default: 4 },
    durationHours: { type: Number, default: 60 },
    deliveryMode: { type: String, enum: ['CLASSROOM', 'BLENDED', 'ONLINE', 'RESIDENTIAL'], default: 'BLENDED' },
    instituteId: { type: String, required: true },
    coordinatorId: { type: String, default: '' },
    capacity: { type: Number, default: 60 },
    enrolledCount: { type: Number, default: 0 },
    completedCount: { type: Number, default: 0 },
    eligibility: {
      minEducation: { type: String, default: '10th Standard / Matriculation' },
      minAge: { type: Number, default: 18 },
      cooperativeAffiliationRequired: { type: Boolean, default: false },
    },
    learningOutcomes: [{ type: String }],
    mappedSkills: [
      {
        skillId: { type: String },
        skillName: { type: String },
        targetLevel: { type: Number, default: 3 },
      },
    ],
    status: {
      type: String,
      enum: ['DRAFT', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED', 'REGISTRATION_OPEN', 'ACTIVE', 'COMPLETED', 'ARCHIVED'],
      default: 'PUBLISHED',
    },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { timestamps: true }
);

export const Programme = mongoose.model('Programme', programmeSchema);
