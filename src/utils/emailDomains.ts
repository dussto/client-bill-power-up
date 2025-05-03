
import { supabase } from '@/integrations/supabase/client';

export interface DnsRecord {
  type: string;
  name: string;
  value: string;
  priority?: number;
  ttl?: number;
}

export interface DomainVerificationResponse {
  success: boolean;
  message: string;
  status?: 'verified' | 'pending' | 'failed';
  dnsRecords?: DnsRecord[];
  error?: string;
}

export async function addEmailDomain(domain: string): Promise<DomainVerificationResponse> {
  try {
    // Call the Supabase function to add a domain to Resend
    const { data, error } = await supabase.functions.invoke('manage-email-domains', {
      body: { action: 'add', domain }
    });

    if (error) throw new Error(error.message);
    
    // Add debug logging
    console.log('Add domain response:', data);
    
    // Check if the response is valid
    if (!data) throw new Error('Invalid response from server');
    
    return data;
  } catch (error) {
    console.error('Error adding email domain:', error);
    return {
      success: false,
      message: `Failed to add domain: ${error instanceof Error ? error.message : String(error)}`,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function checkDomainStatus(domain: string): Promise<DomainVerificationResponse> {
  try {
    // Call the Supabase function to check domain verification status
    const { data, error } = await supabase.functions.invoke('manage-email-domains', {
      body: { action: 'status', domain }
    });

    if (error) throw new Error(error.message);
    
    // Add debug logging
    console.log('Check domain status response:', data);
    
    // Check if the response is valid
    if (!data) throw new Error('Invalid response from server');
    
    return data;
  } catch (error) {
    console.error('Error checking domain status:', error);
    return {
      success: false,
      message: `Failed to check domain status: ${error instanceof Error ? error.message : String(error)}`,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function removeDomain(domain: string): Promise<{ success: boolean; message: string }> {
  try {
    // Call the Supabase function to remove a domain
    const { data, error } = await supabase.functions.invoke('manage-email-domains', {
      body: { action: 'remove', domain }
    });

    if (error) throw new Error(error.message);
    
    // Add more detailed logging
    console.log('Remove domain response:', data);
    
    // Check if the response is valid
    if (!data) throw new Error('Invalid response from server');
    
    return data;
  } catch (error) {
    console.error('Error removing domain:', error);
    return {
      success: false,
      message: `Failed to remove domain: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

export async function getUserDomains(): Promise<string[]> {
  try {
    // Call the Supabase function to get all user domains
    const { data, error } = await supabase.functions.invoke('manage-email-domains', {
      body: { action: 'list' }
    });

    if (error) throw new Error(error.message);
    
    // Check if the response is valid
    if (!data || !data.domains) {
      console.warn('Invalid or empty domains response:', data);
      return [];
    }
    
    return data.domains || [];
  } catch (error) {
    console.error('Error fetching user domains:', error);
    return [];
  }
}
