import { GoogleGenerativeAI } from '@google/generative-ai';
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
  isRealData?: boolean;
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
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
          model: "gemini-2.5-flash",
          generationConfig: { responseMimeType: "application/json" }
        });
        
        const prompt = `You are an expert AI business simulator. Simulate the future of the following company under the scenario: "${scenario}".
Company Details:
- Name: ${company.name}
- Category: ${company.category}
- Size: ${company.employee_size}
- Focus: ${company.focus_sectors}
- Growth: ${company.yoy_growth_rate}
- Tech Stack: ${company.tech_stack}

Return a JSON object conforming strictly to the following structure:
{
  "scenario": "${scenario}",
  "companyId": "${company.company_id}",
  "predictions": {
    "hiringTrends": [{"year": 2026, "hires": 50}, {"year": 2027, "hires": 80}, {"year": 2028, "hires": 120}, {"year": 2029, "hires": 150}, {"year": 2030, "hires": 200}],
    "salaryGrowth": (number percentage),
    "emergingRoles": [(array of strings)],
    "futureTechStack": [(array of strings)],
    "skillDemand": [{"skill": "string", "demandLevel": (number 1-100)}],
    "companyStability": (number 1-100),
    "industryGrowthPotential": (number 1-100)
  },
  "recommendations": {
    "skills": [(array of strings)],
    "certifications": [(array of strings)],
    "courses": [(array of strings)],
    "roadmap": [{"phase": "string", "action": "string"}],
    "futureTechnologies": [(array of strings)]
  },
  "metrics": {
    "aiAdoptionIndicator": (number 1-100),
    "futureOpportunityScore": (number 1-100),
    "riskIndicator": (number 1-100)
  },
  "confidenceScore": (number 80-99)
}
CRITICAL INSTRUCTION: The years in the \`hiringTrends\` array MUST be exactly 2026, 2027, 2028, 2029, and 2030 in that order. Do not use 2024 or 2025.
Ensure the data reflects the provided company details closely. Generate highly realistic, tailored predictions based on the company's specific characteristics and the requested scenario.`;

        const result = await model.generateContent(prompt);
        let text = result.response.text();
        text = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
        const parsed = JSON.parse(text) as SimulationResult;
        parsed.isRealData = true;
        console.log("Successfully generated real Gemini AI prediction:", parsed);
        return parsed;
      } catch (e) {
        console.error("Gemini prediction failed, falling back to rule-based system", e);
      }
    }

    // Fallback: Rule-based logic using real company data
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    let baseStability = 70;
    let baseGrowth = 60;
    let baseRisk = 30;

    // Adjust based on real company size if available
    const sizeStr = company.employee_size || "1-10";
    if (sizeStr.includes("100") || sizeStr.includes("500") || sizeStr.includes("1000")) {
      baseStability += 15;
      baseRisk -= 10;
    } else {
      baseGrowth += 10;
      baseRisk += 10;
    }

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

    const clamp = (val: number) => Math.max(10, Math.min(95, val));
    const isNegative = scenario === 'Funding Reduction' || scenario === 'Economic Recession';
    
    // Use real company tech stack for future tech stack if available
    const existingTech = typeof company.tech_stack === 'string' ? company.tech_stack.split(', ') : (company.tech_stack || []);
    const baseTech = Array.isArray(existingTech) && existingTech.length > 0 ? existingTech.slice(0, 2) : ['React', 'Node.js'];
    const futureTech = [...baseTech, 'WebAssembly', 'GPT-5 API', 'GraphQL', 'Terraform'].slice(0, 5);
    
    // Tailored emerging roles based on real category
    const cat = (company.category || '').toLowerCase();
    let roles = [
      'AI Prompt Engineer',
      'Autonomous Systems Manager',
      'Ethics & Compliance Lead',
      'Remote Culture Coordinator'
    ];
    if (cat.includes('fin')) roles[1] = 'DeFi Smart Contract Auditor';
    if (cat.includes('health')) roles[1] = 'Telehealth Automation Specialist';

    return {
      scenario,
      companyId: company.company_id,
      isRealData: false,
      confidenceScore: Math.floor(Math.random() * 15) + 80, // 80-95%
      predictions: {
        hiringTrends: [
          { year: 2026, hires: isNegative ? 10 : 50 },
          { year: 2027, hires: isNegative ? -5 : 80 },
          { year: 2028, hires: isNegative ? -15 : 120 },
          { year: 2029, hires: isNegative ? -5 : 150 },
          { year: 2030, hires: isNegative ? 15 : 200 }
        ],
        salaryGrowth: scenario === 'Startup Hypergrowth' ? 25 : isNegative ? 2 : 12,
        emergingRoles: roles,
        futureTechStack: futureTech,
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
