
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
  status?: 'verified' | 'pending' | 'failed' | 'not_started';
  dnsRecords?: DnsRecord[];
  error?: string;
}

// Helper function to retry failed API calls with backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> {
  let retries = 0;
  
  while (true) {
    try {
      return await fn();
    } catch (error) {
      retries++;
      if (retries > maxRetries) {
        throw error;
      }
      
      // Exponential backoff with jitter
      const delay = initialDelay * Math.pow(1.5, retries) + Math.random() * 500;
      console.log(`API call failed, retrying (${retries}/${maxRetries}) after ${Math.round(delay)}ms...`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

export async function addEmailDomain(domain: string): Promise<DomainVerificationResponse> {
  try {
    console.log(`Adding domain: ${domain}`);
    
    // Call the Supabase function with retry logic
    const { data, error } = await retryWithBackoff(() => 
      supabase.functions.invoke('manage-email-domains', {
        body: { action: 'add', domain }
      })
    );

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(error.message);
    }
    
    // Add debug logging
    console.log('Add domain response:', data);
    
    if (!data) {
      return {
        success: false,
        message: 'Invalid response from server',
      };
    }
    
    // If we have DNS records, return them immediately
    if (data.dnsRecords && data.dnsRecords.length > 0) {
      return data;
    }
    
    // If no DNS records were returned immediately, try to get them by checking the status
    console.log('No DNS records returned, checking domain status to retrieve them...');
    
    // Wait a moment before checking status
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try to get DNS records through status check
    try {
      const statusResponse = await checkDomainStatus(domain);
      
      if (statusResponse.success && statusResponse.dnsRecords && statusResponse.dnsRecords.length > 0) {
        console.log('Retrieved DNS records from status check:', statusResponse.dnsRecords);
        return {
          ...data,
          dnsRecords: statusResponse.dnsRecords,
          status: statusResponse.status || data.status
        };
      }
    } catch (statusError) {
      console.error('Error getting DNS records via status check:', statusError);
    }
    
    // If status check didn't work, try verification endpoint
    try {
      console.log('Status check did not return DNS records, trying verification endpoint...');
      const verifyResponse = await verifyDomain(domain);
      
      if (verifyResponse.success && verifyResponse.dnsRecords && verifyResponse.dnsRecords.length > 0) {
        console.log('Retrieved DNS records from verify endpoint:', verifyResponse.dnsRecords);
        return {
          ...data,
          dnsRecords: verifyResponse.dnsRecords,
          status: verifyResponse.status || data.status
        };
      }
    } catch (verifyError) {
      console.error('Error getting DNS records via verify endpoint:', verifyError);
    }
    
    // Return what we have even if we don't have DNS records
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

export async function verifyDomain(domain: string): Promise<DomainVerificationResponse> {
  try {
    console.log(`Verifying domain: ${domain}`);
    
    // Call the Supabase function with retry logic
    const { data, error } = await retryWithBackoff(() =>
      supabase.functions.invoke('manage-email-domains', {
        body: { action: 'verify', domain }
      })
    );

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(error.message);
    }
    
    // Add debug logging
    console.log('Verify domain response:', data);
    
    if (!data) {
      return {
        success: false,
        message: 'Invalid response from server',
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error verifying domain:', error);
    return {
      success: false,
      message: `Failed to verify domain: ${error instanceof Error ? error.message : String(error)}`,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function checkDomainStatus(domain: string): Promise<DomainVerificationResponse> {
  try {
    console.log(`Checking domain status: ${domain}`);
    
    // Call the Supabase function with retry logic
    const { data, error } = await retryWithBackoff(() =>
      supabase.functions.invoke('manage-email-domains', {
        body: { action: 'status', domain }
      })
    );

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(error.message);
    }
    
    // Add debug logging
    console.log('Check domain status response:', data);
    
    if (!data) {
      return {
        success: false,
        message: 'Invalid response from server',
      };
    }
    
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
    console.log(`Removing domain: ${domain}`);
    
    // Call the Supabase function with retry logic
    const { data, error } = await retryWithBackoff(() =>
      supabase.functions.invoke('manage-email-domains', {
        body: { action: 'remove', domain }
      })
    );

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(error.message);
    }
    
    // Add more detailed logging
    console.log('Remove domain response:', data);
    
    if (!data) {
      return {
        success: false,
        message: 'Invalid response from server',
      };
    }
    
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
    console.log('Getting user domains');
    
    // Call the Supabase function with retry logic
    const { data, error } = await retryWithBackoff(() =>
      supabase.functions.invoke('manage-email-domains', {
        body: { action: 'list' }
      })
    );

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(error.message);
    }
    
    // Debug logging
    console.log('Get user domains response:', data);
    
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
