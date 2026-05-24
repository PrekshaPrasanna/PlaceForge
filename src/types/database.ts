export interface Company {
  company_id: string; // Primary key
  name: string;
  short_name: string;
  category: string;
  employee_size: string | null;
  focus_sectors: string | string[]; // Can be string in DB
  hiring_velocity: string | null;
  employee_turnover: string | null;
  avg_retention_tenure: string | null;
  profitability_status: string | null;
  remote_policy_details: string | null;
  logo_url: string;
  tech_stack: string | string[]; // Can be string in DB
  yoy_growth_rate: string | null;
  brand_value: string | null;
  overview_text: string | null;
  website_url: string | null;
  linkedin_url: string | null;
  twitter_handle: string | null;
  
  // Detail page fields
  company_overview: string | null;
  business_and_market: string | null;
  culture_and_work: string | null;
  learning_and_career_signal: string | null;
  compensation: string | null;
  work_logistics_and_safety: string | null;
  financials_and_risk: string | null;
  technology_and_innovation: string | null;
  leadership_and_contacts: string | null;
  brand_and_digital_presence: string | null;
  
  // InnovX fields
  ai_ml_adoption_level: string | null;
  automation_level: string | null;
  skill_relevance: string | null;
  
  // Allows for any other 140+ columns without breaking type constraints
  [key: string]: any;
}
