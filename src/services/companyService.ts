import { supabase } from '../lib/supabaseClient';
import type { Company } from '../types/database';

export const companyService = {
  async getAllCompanies(columns: string = '*'): Promise<Company[]> {
    const { data, error } = await supabase
      .from('company')
      .select(columns);
    
    if (error) {
      console.error('Error fetching all companies:', error);
      throw error;
    }
    
    return (data || []) as unknown as Company[];
  },

  async getCompanyById(company_id: string): Promise<Company | null> {
    const { data, error } = await supabase
      .from('company')
      .select('*')
      .eq('company_id', company_id)
      .single();
      
    if (error) {
      console.error(`Error fetching company ${company_id}:`, error);
      return null;
    }
    
    return data as unknown as Company;
  },

  async getCompaniesByCategory(category: string, columns: string = '*'): Promise<Company[]> {
    const { data, error } = await supabase
      .from('company')
      .select(columns)
      .eq('category', category);
      
    if (error) {
      console.error(`Error fetching companies for category ${category}:`, error);
      throw error;
    }
    
    return (data || []) as unknown as Company[];
  },

  async searchCompanies(query: string, columns: string = '*'): Promise<Company[]> {
    const { data, error } = await supabase
      .from('company')
      .select(columns)
      .or(`name.ilike.%${query}%,category.ilike.%${query}%`);
      
    if (error) {
      console.error('Error searching companies:', error);
      throw error;
    }
    
    return (data || []) as unknown as Company[];
  },
  
  async compareCompanies(companyIds: string[], columns: string = '*'): Promise<Company[]> {
    if (!companyIds.length) return [];
    
    const { data, error } = await supabase
      .from('company')
      .select(columns)
      .in('company_id', companyIds);
      
    if (error) {
      console.error('Error fetching companies for comparison:', error);
      throw error;
    }
    
    return (data || []) as unknown as Company[];
  }
};
