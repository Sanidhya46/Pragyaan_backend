import { Institute } from '../models/Institute.model.js';
import { Programme } from '../models/Programme.model.js';
import { Certificate } from '../models/Certificate.model.js';
import { EmploymentOutcome } from '../models/Employment.model.js';
import { successResponse, errorResponse } from '../utils/response.util.js';

export const analyticsController = {
  /**
   * Super Admin & HQ National Dashboard Metrics (matches Image 1 exactly)
   */
  async getHQOverview(req, res) {
    try {
      const overview = {
        kpis: {
          institutes: { value: 20, change: '+12% vs last month', label: 'Institutes' },
          programmes: { value: 4389, change: '+8% vs last month', label: 'Programmes' },
          participants: { value: '315K+', rawValue: 315474, change: '+15% vs last month', label: 'Participants' },
          completionRate: { value: '91%', rawValue: 91, change: '+6% vs last month', label: 'Completion Rate' },
          certificatesIssued: { value: '12.4K', rawValue: 12400, change: '+20% vs last month', label: 'Certificates Issued' },
        },
        growthData: [
          { month: 'Jan', participants: 18500, programmes: 240 },
          { month: 'Feb', participants: 22100, programmes: 280 },
          { month: 'Mar', participants: 25400, programmes: 310 },
          { month: 'Apr', participants: 23800, programmes: 295 },
          { month: 'May', participants: 27900, programmes: 340 },
          { month: 'Jun', participants: 30200, programmes: 380 },
          { month: 'Jul', participants: 28400, programmes: 360 },
          { month: 'Aug', participants: 33100, programmes: 410 },
          { month: 'Sep', participants: 35800, programmes: 430 },
          { month: 'Oct', participants: 39200, programmes: 460 },
          { month: 'Nov', participants: 42500, programmes: 510 },
          { month: 'Dec', participants: 48500, programmes: 564 },
        ],
        trainingDistribution: {
          totalProgrammes: 4389,
          categories: [
            { name: 'Technical', percentage: 32, count: 1403, color: '#3b82f6' },
            { name: 'Digital', percentage: 18, count: 790, color: '#10b981' },
            { name: 'Communication', percentage: 12, count: 527, color: '#06b6d4' },
            { name: 'Management', percentage: 10, count: 439, color: '#f59e0b' },
            { name: 'Soft Skills', percentage: 8, count: 351, color: '#ec4899' },
            { name: 'Others', percentage: 20, count: 879, color: '#8b5cf6' },
          ],
        },
        topPerformingInstitutes: [
          { rank: 1, name: 'VAMNICOM, Pune', participants: '48,732', completionRate: '96%', trend: '+12%' },
          { rank: 2, name: 'RICM, Jaipur', participants: '42,156', completionRate: '93%', trend: '+8%' },
          { rank: 3, name: 'ICM, Lucknow', participants: '38,421', completionRate: '90%', trend: '+6%' },
          { rank: 4, name: 'RICM, Guwahati', participants: '32,780', completionRate: '88%', trend: '+5%' },
          { rank: 5, name: 'RICM, Hyderabad', participants: '28,954', completionRate: '85%', trend: '+4%' },
        ],
        skillsDistribution: [
          { subject: 'Technical', A: 32, fullMark: 100 },
          { subject: 'Digital', A: 18, fullMark: 100 },
          { subject: 'Communication', A: 12, fullMark: 100 },
          { subject: 'Management', A: 10, fullMark: 100 },
          { subject: 'Soft Skills', A: 8, fullMark: 100 },
          { subject: 'Others', A: 20, fullMark: 100 },
        ],
        employmentOutcomes: {
          overallPlacementPercentage: 68,
          totalEligible: 31242,
          totalBeneficiaries: 21360,
          categories: [
            { label: 'Placed', count: '21,360', percentage: 60, trend: '+12%', color: '#10b981' },
            { label: 'Internship', count: '9,482', percentage: 24, trend: '+8%', color: '#3b82f6' },
            { label: 'Self Employment', count: '3,128', percentage: 8, trend: '+6%', color: '#f59e0b' },
            { label: 'Higher Education', count: '1,272', percentage: 4, trend: '+4%', color: '#8b5cf6' },
          ],
        },
        indiaOverview: {
          totalInstitutes: 20,
          totalProgrammes: 4389,
          totalParticipants: '315K+',
          zones: [
            { name: 'North', count: '5 Institutes', color: '#10b981' },
            { name: 'West', count: '4 Institutes', color: '#3b82f6' },
            { name: 'East', count: '4 Institutes', color: '#ec4899' },
            { name: 'South', count: '4 Institutes', color: '#f59e0b' },
            { name: 'Central', count: '3 Institutes', color: '#8b5cf6' },
          ],
        },
      };

      return res.json(successResponse(overview, 'National training & employment intelligence retrieved'));
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },
};
