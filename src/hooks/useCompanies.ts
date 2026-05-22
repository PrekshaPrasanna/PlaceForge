import { useState, useEffect } from 'react';
import { companyService } from '../services/companyService';
import type { Company } from '../types/database';

export type { Company }; // Re-export to avoid breaking existing imports

export function useCompanies(category?: string, searchQuery?: string) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchCompanies = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        let data;
        // Optimize payload by only selecting fields needed for listing
        // Adding company_id instead of id. We alias id so UI doesn't break if it expects id, 
        // wait the UI uses company.id? I must update UI to use company_id if I follow "no renaming"
        // I will just use company_id and update UI where needed.
        const listingColumns = 'company_id, name, short_name, category, employee_size, focus_sectors, hiring_velocity, profitability_status, remote_policy_details, logo_url, tech_stack, brand_value, ai_ml_adoption_level, automation_level, skill_relevance, overview_text, website_url, linkedin_url, twitter_handle';

        if (searchQuery) {
          data = await companyService.searchCompanies(searchQuery, listingColumns);
        } else if (category) {
          data = await companyService.getCompaniesByCategory(category, listingColumns);
        } else {
          data = await companyService.getAllCompanies(listingColumns);
        }
        
        if (isMounted) setCompanies(data);
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchCompanies();
    
    return () => {
      isMounted = false;
    };
  }, [category, searchQuery]);

  return { companies, isLoading, error };
}

export function useCompany(company_id?: string) {
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!company_id) {
        setIsLoading(false);
        return;
    }
    
    let isMounted = true;

    const fetchCompany = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await companyService.getCompanyById(company_id);
        
        if (isMounted) setCompany(data);
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchCompany();
    
    return () => {
      isMounted = false;
    };
  }, [company_id]);

  return { company, isLoading, error };
}
