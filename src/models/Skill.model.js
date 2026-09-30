import mongoose from 'mongoose';

const skillTaxonomySchema = new mongoose.Schema(
  {
    skillId: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    category: { type: String, enum: ['Technical', 'Digital', 'Communication', 'Management', 'Soft Skills'], default: 'Digital' },
    description: { type: String, default: '' },
    demandLevel: { type: String, enum: ['HIGH', 'MEDIUM', 'GROWING'], default: 'HIGH' },
  },
  { timestamps: true }
);

export const Skill = mongoose.model('Skill', skillTaxonomySchema);

const traineeSkillSchema = new mongoose.Schema(
  {
    traineeId: { type: String, required: true },
    skillId: { type: String, required: true },
    skillName: { type: String, required: true },
    proficiencyScore: { type: Number, default: 70 }, // 0 to 100
    level: { type: Number, default: 3 }, // 1 to 5
    evidence: [
      {
        sourceType: { type: String, enum: ['ASSESSMENT', 'CERTIFICATE', 'PROJECT'], default: 'ASSESSMENT' },
        referenceId: { type: String },
        score: { type: Number },
        verifiedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);
traineeSkillSchema.index({ traineeId: 1, skillId: 1 }, { unique: true });

export const TraineeSkill = mongoose.model('TraineeSkill', traineeSkillSchema);
