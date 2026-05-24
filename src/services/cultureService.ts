import { supabase } from '../lib/supabaseClient';

export interface StudentCultureAssessment {
  teamwork: number;
  communication: number;
  adaptability: number;
  problem_solving: number;
  leadership: number;
  work_style_preference: string;
  pace_preference: string;
}

export interface CultureProfile {
  company_name: string;
  culture_description: string;
  teamwork: number;
  communication: number;
  adaptability: number;
  problem_solving: number;
  leadership: number;
}

export interface CompatibilityResult {
  company_name: string;
  overall_score: number;
  fit_label: string;
  color: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "When starting a new project, how do you prefer to coordinate tasks?",
    options: [
      { text: "Sync up immediately in a group brainstorming session to distribute roles collectively." },
      { text: "Review the objectives alone, draft my part, and request feedback asynchronously." }
    ]
  },
  {
    id: 2,
    question: "How do you handle sudden shifts in project requirements due to client feedback?",
    options: [
      { text: "Pivot smoothly, embrace the change, and adjust my tasks without delay." },
      { text: "Prefer a formal review of the changes, planning a detailed sprint adjustments list first." }
    ]
  },
  {
    id: 3,
    question: "What is your communication philosophy during active project sprints?",
    options: [
      { text: "Frequent check-ins, slack messages, and active pairing to resolve blockers together." },
      { text: "Focus deeply for hours and update status updates during daily stands or boards." }
    ]
  },
  {
    id: 4,
    question: "What kind of work speed keeps you most engaged?",
    options: [
      { text: "Rapid iterations, shipping code daily, and responding to live challenges." },
      { text: "Predictable, well-planned timelines where depth and comprehensive reviews come first." }
    ]
  },
  {
    id: 5,
    question: "In a team conflict over which framework or technology to use, what is your approach?",
    options: [
      { text: "Facilitate a debate, document the pros/cons, and steer the group toward a consensus." },
      { text: "Write benchmark scripts and present data-backed results to decide objectively." }
    ]
  },
  {
    id: 6,
    question: "If you encounter a complex bug in production that you do not understand, you usually:",
    options: [
      { text: "Start a collaborative debugging session or invite teammates to inspect the trace." },
      { text: "Isolate the variables, study the source docs, and reproduce the bug locally on my own." }
    ]
  },
  {
    id: 7,
    question: "How do you view standard operating procedures and coding guidelines?",
    options: [
      { text: "Guidelines are great starting points, but we should bend them when faster results are needed." },
      { text: "Strict conformance ensures consistency, high readability, and long-term codebase safety." }
    ]
  },
  {
    id: 8,
    question: "In a hackathon or tight-deadline project, what role do you naturally fall into?",
    options: [
      { text: "Keeping the team organized, setting milestones, and ensuring we align on the final demo." },
      { text: "Diving deep into the core technical engine, writing the critical functionality." }
    ]
  },
  {
    id: 9,
    question: "Which feedback style do you find most constructive?",
    options: [
      { text: "Immediate, informal verbal chats to iterate and adjust dynamically." },
      { text: "Formal, written peer review reports with structured metrics and action items." }
    ]
  },
  {
    id: 10,
    question: "When asked to learn a completely new programming language or tool overnight:",
    options: [
      { text: "I get excited! I love diving headfirst into unknown waters and playing with samples." },
      { text: "I feel cautious. I prefer reading formal guides first before writing production code." }
    ]
  },
  {
    id: 11,
    question: "How do you feel about working in a highly cross-functional environment with product, marketing, and sales?",
    options: [
      { text: "Energetic! I love aligning multiple viewpoints and translating technical ideas for business stakeholders." },
      { text: "Focused. I prefer keeping the scope clean and executing engineering specifications directly." }
    ]
  },
  {
    id: 12,
    question: "When a teammate makes a mistake that delays the sprint, you:",
    options: [
      { text: "Call them directly to offer help, share workloads, and get the sprint back on course." },
      { text: "Let the team lead handle it and focus on ensuring my own sprint deliverables are flawless." }
    ]
  }
];

export const cultureService = {
  async fetchAssessment(): Promise<StudentCultureAssessment | null> {
    const saved = localStorage.getItem('culture_assessment');
    return saved ? JSON.parse(saved) : null;
  },

  async getAllCultureProfiles(): Promise<CultureProfile[]> {
    try {
      const { data, error } = await supabase.from('company').select('*');
      if (error || !data) throw error;
      
      return data.map(company => {
        // Deterministically hash string to a number 1-10 to generate realistic unique profiles
        const hash = (str: string) => {
          let h = 0;
          for(let i = 0; i < str.length; i++) { h = Math.imul(31, h) + str.charCodeAt(i) | 0; }
          return Math.abs(h);
        };
        const getScore = (val: string, base: number) => Math.min(10, Math.max(1, base + (hash(val) % 5) - 2));

        return {
          company_name: company.name,
          culture_description: company.work_culture_summary || company.company_description || "A dynamic and innovative corporate culture.",
          teamwork: getScore(company.name + 't', 7),
          communication: getScore(company.name + 'c', 8),
          adaptability: getScore(company.name + 'a', 6),
          problem_solving: getScore(company.name + 'p', 7),
          leadership: getScore(company.name + 'l', 6)
        };
      });
    } catch (err) {
      console.error("Failed to fetch companies from database", err);
      return [];
    }
  },

  quizResponsesToAssessment(responses: Record<number, number>): StudentCultureAssessment {
    // Start with base score of 5
    let t = 5, c = 5, a = 5, p = 5, l = 5;

    // Map the 12 questions
    // Opt 0 typically represents highly collaborative / agile / active leadership
    // Opt 1 typically represents independent / structured / deep work
    if (responses[1] === 0) t += 2; else t -= 1;
    if (responses[2] === 0) a += 2; else a -= 1;
    if (responses[3] === 0) c += 2; else c -= 1;
    
    // Pace Preference
    const pace = responses[4] === 0 ? "Fast & Iterative" : "Structured & Predictable";
    
    if (responses[5] === 0) { l += 1; c += 1; } else { p += 2; }
    if (responses[6] === 0) t += 1; else { p += 1; t -= 1; }
    if (responses[7] === 0) a += 1; else { a -= 1; p += 1; }
    if (responses[8] === 0) l += 2; else { l -= 1; p += 1; }
    if (responses[9] === 0) { c += 1; a += 1; } else { c -= 1; }
    if (responses[10] === 0) a += 2; else a -= 1;
    if (responses[11] === 0) { c += 2; l += 1; } else { c -= 1; }
    if (responses[12] === 0) t += 2; else t -= 1;

    const clamp = (val: number) => Math.min(10, Math.max(1, val));

    // Determine Work Style Preference based on teamwork + comm
    let style = "Independent Deep Worker";
    if (t + c >= 14) style = "Highly Collaborative Agile";
    else if (t + c >= 10) style = "Balanced Contributor";

    return {
      teamwork: clamp(t),
      communication: clamp(c),
      adaptability: clamp(a),
      problem_solving: clamp(p),
      leadership: clamp(l),
      work_style_preference: style,
      pace_preference: pace
    };
  },

  async saveAssessment(assessment: StudentCultureAssessment): Promise<StudentCultureAssessment> {
    localStorage.setItem('culture_assessment', JSON.stringify(assessment));
    return assessment;
  },

  async clearAssessment(): Promise<void> {
    localStorage.removeItem('culture_assessment');
  },

  async checkAllCompatibilities(assessment: StudentCultureAssessment): Promise<CompatibilityResult[]> {
    const profiles = await this.getAllCultureProfiles();
    
    return profiles.map(profile => {
      const diffs = [
        Math.abs(assessment.teamwork - profile.teamwork),
        Math.abs(assessment.communication - profile.communication),
        Math.abs(assessment.adaptability - profile.adaptability),
        Math.abs(assessment.problem_solving - profile.problem_solving),
        Math.abs(assessment.leadership - profile.leadership)
      ];
      
      const totalDiff = diffs.reduce((a, b) => a + b, 0);
      const maxPossibleDiff = 50;
      // Stricter grading formula
      const matchScore = Math.max(0, 100 - Math.round((totalDiff / maxPossibleDiff) * 100 * 1.5));

      let fit_label = "Low Fit";
      let color = "#ef4444"; // red
      if (matchScore >= 80) { fit_label = "Excellent Fit"; color = "#22c55e"; }
      else if (matchScore >= 60) { fit_label = "Good Fit"; color = "#eab308"; }
      else if (matchScore >= 40) { fit_label = "Moderate Fit"; color = "#f97316"; }

      const strengths = [];
      const weaknesses = [];
      if (Math.abs(assessment.teamwork - profile.teamwork) <= 1) strengths.push("Aligned on team collaboration style");
      if (Math.abs(assessment.adaptability - profile.adaptability) <= 1) strengths.push("Similar pacing and adaptability");
      if (Math.abs(assessment.communication - profile.communication) >= 3) weaknesses.push("Divergent communication preferences");
      if (Math.abs(assessment.leadership - profile.leadership) >= 3) weaknesses.push("Mismatched leadership expectations");

      if (strengths.length === 0) strengths.push("Baseline cultural compatibility");

      return {
        company_name: profile.company_name,
        overall_score: matchScore,
        fit_label,
        color,
        strengths,
        weaknesses,
        suggestions: weaknesses.length > 0 ? ["Consider open discussions about your working style during interviews."] : ["Great alignment—highlight your natural fit when applying!"]
      };
    }).sort((a, b) => b.overall_score - a.overall_score);
  }
};
