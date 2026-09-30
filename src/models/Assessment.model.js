import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  questionId: { type: String, required: true },
  text: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctOptionIndex: { type: Number, required: true },
  marks: { type: Number, default: 5 },
  mappedSkill: { type: String },
});

const assessmentSchema = new mongoose.Schema(
  {
    assessmentId: { type: String, unique: true, required: true },
    title: { type: String, required: true },
    programmeId: { type: String, required: true },
    courseId: { type: String },
    type: { type: String, enum: ['QUIZ', 'MODULE_TEST', 'FINAL_EXAM'], default: 'QUIZ' },
    totalMarks: { type: Number, default: 50 },
    passingMarks: { type: Number, default: 25 },
    durationMinutes: { type: Number, default: 30 },
    questions: [questionSchema],
    status: { type: String, enum: ['ACTIVE', 'ARCHIVED'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

export const Assessment = mongoose.model('Assessment', assessmentSchema);

const assessmentAttemptSchema = new mongoose.Schema(
  {
    attemptId: { type: String, unique: true, required: true },
    assessmentId: { type: String, required: true },
    traineeId: { type: String, required: true },
    traineeName: { type: String, default: '' },
    score: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    answers: [{ questionId: String, selectedOption: Number, isCorrect: Boolean }],
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const AssessmentAttempt = mongoose.model('AssessmentAttempt', assessmentAttemptSchema);
