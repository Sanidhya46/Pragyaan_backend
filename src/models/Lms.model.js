import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema({
  lessonId: { type: String, required: true },
  title: { type: String, required: true },
  orderIndex: { type: Number, default: 1 },
  durationMinutes: { type: Number, default: 20 },
  contentType: { type: String, enum: ['VIDEO', 'PDF', 'AUDIO', 'MARKDOWN'], default: 'VIDEO' },
  contentUrl: { type: String, default: '' },
  description: { type: String, default: '' },
  multilingual: [
    {
      languageCode: { type: String }, // 'en', 'hi', 'mr', 'ta', etc.
      languageTitle: { type: String },
      translatedContentUrl: { type: String },
    },
  ],
});

const moduleSchema = new mongoose.Schema({
  moduleId: { type: String, required: true },
  title: { type: String, required: true },
  orderIndex: { type: Number, default: 1 },
  lessons: [lessonSchema],
});

const courseSchema = new mongoose.Schema(
  {
    courseId: { type: String, unique: true, required: true },
    programmeId: { type: String, required: true },
    title: { type: String, required: true },
    category: { type: String, default: 'Computer Application' },
    durationHours: { type: Number, default: 40 },
    thumbnailUrl: { type: String, default: '' },
    description: { type: String, default: '' },
    instructorName: { type: String, default: 'NCCT Faculty' },
    modules: [moduleSchema],
    skillsCovered: [{ type: String }],
    status: { type: String, enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'], default: 'PUBLISHED' },
  },
  { timestamps: true }
);

export const Course = mongoose.model('Course', courseSchema);

const userProgressSchema = new mongoose.Schema(
  {
    traineeId: { type: String, required: true },
    courseId: { type: String, required: true },
    completedLessons: [{ type: String }],
    progressPercentage: { type: Number, default: 0 },
    lastAccessedLessonId: { type: String },
    lastActiveDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
userProgressSchema.index({ traineeId: 1, courseId: 1 }, { unique: true });

export const UserProgress = mongoose.model('UserProgress', userProgressSchema);
