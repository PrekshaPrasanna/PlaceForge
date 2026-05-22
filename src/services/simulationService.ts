import type { Company } from '../types/database';

export type SimulationScenario = 
  | 'Heavy AI Adoption'
  | 'Rapid Global Expansion'
  | 'Funding Reduction'
  | 'Economic Recession'
  | 'Startup Hypergrowth'
  | 'Remote-First Transformation';

export interface SimulationResult {
  scenario: SimulationScenario;
  companyId: string;
  predictions: {
    hiringTrends: { year: number; hires: number }[];
    salaryGrowth: number; // percentage
    emergingRoles: string[];
    futureTechStack: string[];
    skillDemand: { skill: string; demandLevel: number }[]; // demandLevel 1-100
    companyStability: number; // 1-100
    industryGrowthPotential: number; // 1-100
  };
  recommendations: {
    skills: string[];
    certifications: string[];
    courses: string[];
    roadmap: { phase: string; action: string }[];
    futureTechnologies: string[];
  };
  metrics: {
    aiAdoptionIndicator: number; // 1-100
    futureOpportunityScore: number; // 1-100
    riskIndicator: number; // 1-100
  };
  confidenceScore: number;
}

export const simulationService = {
  async runSimulation(company: Company, scenario: SimulationScenario): Promise<SimulationResult> {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Rule-based logic / Mock AI response based on scenario
    let baseStability = 70;
    let baseGrowth = 60;
    let baseRisk = 30;

    switch (scenario) {
      case 'Heavy AI Adoption':
        baseStability += 10;
        baseGrowth += 20;
        baseRisk += 15;
        break;
      case 'Rapid Global Expansion':
        baseStability -= 5;
        baseGrowth += 30;
        baseRisk += 25;
        break;
      case 'Funding Reduction':
        baseStability -= 30;
        baseGrowth -= 20;
        baseRisk += 40;
        break;
      case 'Economic Recession':
        baseStability -= 20;
        baseGrowth -= 15;
        baseRisk += 35;
        break;
      case 'Startup Hypergrowth':
        baseStability -= 10;
        baseGrowth += 40;
        baseRisk += 30;
        break;
      case 'Remote-First Transformation':
        baseStability += 5;
        baseGrowth += 5;
        baseRisk -= 10;
        break;
    }

    // Clamp values between 10 and 95
    const clamp = (val: number) => Math.max(10, Math.min(95, val));

    const isNegative = scenario === 'Funding Reduction' || scenario === 'Economic Recession';

    return {
      scenario,
      companyId: company.company_id,
      confidenceScore: Math.floor(Math.random() * 15) + 80, // 80-95%
      predictions: {
        hiringTrends: [
          { year: 2024, hires: isNegative ? 10 : 50 },
          { year: 2025, hires: isNegative ? -5 : 80 },
          { year: 2026, hires: isNegative ? -15 : 120 },
          { year: 2027, hires: isNegative ? -5 : 150 },
          { year: 2028, hires: isNegative ? 15 : 200 }
        ],
        salaryGrowth: scenario === 'Startup Hypergrowth' ? 25 : isNegative ? 2 : 12,
        emergingRoles: [
          'AI Prompt Engineer',
          'Autonomous Systems Manager',
          'Ethics & Compliance Lead',
          'Remote Culture Coordinator'
        ],
        futureTechStack: [
          'Rust', 'WebAssembly', 'GPT-5 API', 'GraphQL', 'Terraform'
        ],
        skillDemand: [
          { skill: 'Machine Learning', demandLevel: 95 },
          { skill: 'Cloud Architecture', demandLevel: 88 },
          { skill: 'Cybersecurity', demandLevel: 92 },
          { skill: 'Data Analytics', demandLevel: 85 }
        ],
        companyStability: clamp(baseStability),
        industryGrowthPotential: clamp(baseGrowth),
      },
      metrics: {
        aiAdoptionIndicator: scenario === 'Heavy AI Adoption' ? 95 : 65,
        futureOpportunityScore: clamp(baseGrowth + 10),
        riskIndicator: clamp(baseRisk),
      },
      recommendations: {
        skills: ['Deep Learning', 'System Design', 'Strategic Communication'],
        certifications: ['AWS Certified Machine Learning', 'Certified Kubernetes Administrator'],
        courses: ['Advanced AI Specialization', 'Cloud Native Architecture'],
        roadmap: [
          { phase: '0-6 Months', action: 'Upskill in core AI/ML libraries and modern cloud deployments' },
          { phase: '6-12 Months', action: 'Obtain recognized certifications and lead small internal transitions' },
          { phase: '1-2 Years', action: 'Transition into strategic architecture or specialized emerging roles' }
        ],
        futureTechnologies: ['Quantum Computing basics', 'Neuromorphic Engineering']
      }
    };
  }
};
