import mongoose from 'mongoose';

const programmeBudgetSchema = new mongoose.Schema(
  {
    budgetId: { type: String, unique: true, required: true },
    programmeId: { type: String, required: true, index: true },
    instituteId: { type: String, required: true, index: true },
    financialYear: { type: String, default: '2025-2026' },
    schemeName: { type: String, default: 'NCCT Central Cooperative Capacity Grant' },
    allocatedBudget: { type: Number, required: true },
    approvedExpenditure: { type: Number, default: 0 },
    actualExpenditure: { type: Number, default: 0 },
    grantReceived: { type: Number, default: 0 },
    utilizationPercentage: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['DRAFT', 'APPROVED', 'UTILIZED', 'CLOSED'],
      default: 'APPROVED'
    },
    expenses: [
      {
        expenseId: { type: String },
        category: {
          type: String,
          enum: ['FACULTY_HONORARIUM', 'CATERING', 'HOSTEL_MAINTENANCE', 'STUDY_MATERIAL', 'HARDWARE_EDGE', 'CONTINGENCY']
        },
        amount: { type: Number },
        date: { type: Date, default: Date.now },
        invoiceRef: { type: String },
        approvedBy: { type: String }
      }
    ]
  },
  { timestamps: true }
);

export const ProgrammeBudget = mongoose.model('ProgrammeBudget', programmeBudgetSchema);
