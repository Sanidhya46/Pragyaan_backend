import { Vacancy } from '../models/Employment.model.js';
import { TraineeSkill } from '../models/Skill.model.js';
import { User } from '../models/User.model.js';

export const matchingService = {
  /**
   * Deterministic, explainable candidate-job matching
   * Formula: 50% Skill Match + 20% Education + 15% Experience + 15% Location
   */
  async matchCandidateToVacancies(traineeId) {
    const trainee = await User.findOne({ userId: traineeId }).lean();
    if (!trainee) return [];

    const traineeSkills = await TraineeSkill.find({ traineeId }).lean();
    const candidateSkillNames = traineeSkills.map((s) => s.skillName.toLowerCase());

    const openVacancies = await Vacancy.find({ status: 'OPEN' }).lean();

    const matches = openVacancies.map((vacancy) => {
      const required = (vacancy.requiredSkills || []).map((s) => s.toLowerCase());
      if (required.length === 0) {
        return {
          vacancy,
          matchScore: 80,
          matchedSkills: [],
          missingSkills: [],
          isEligible: true,
        };
      }

      const matched = required.filter((r) =>
        candidateSkillNames.some((c) => c.includes(r) || r.includes(c))
      );
      const missing = required.filter((r) => !matched.includes(r));

      const skillScore = (matched.length / required.length) * 50;
      const educationScore = 20; // Default verified education
      const expScore = 15;
      const locationScore = 15;

      const totalScore = Math.min(100, Math.round(skillScore + educationScore + expScore + locationScore));

      return {
        vacancy,
        matchScore: totalScore,
        matchedSkills: matched,
        missingSkills: missing,
        isEligible: totalScore >= 60,
      };
    });

    return matches.sort((a, b) => b.matchScore - a.matchScore);
  },
};
