
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

export async function addEmailDomain(domain: string): Promise<DomainVerificationResponse> {
  try {
    console.log(`Adding domain: ${domain}`);
    
    // Call the Supabase function to add a domain to Resend
    const { data, error } = await supabase.functions.invoke('manage-email-domains', {
      body: { action: 'add', domain }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(error.message);
    }
    
    // Add debug logging
    console.log('Add domain response:', data);
    
    // If no DNS records were returned immediately, try to get them by checking the status
    if (data && data.success && (!data.dnsRecords || data.dnsRecords.length === 0)) {
      console.log('No DNS records returned, checking domain status to retrieve them...');
      
      // Wait a moment before checking status
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Try multiple times to get DNS records
      for (let i = 0; i < 3; i++) {
        console.log(`Attempt ${i+1} to retrieve DNS records...`);
        const statusResponse = await checkDomainStatus(domain);
        
        // If status check returned DNS records, merge them with the original response
        if (statusResponse.success && statusResponse.dnsRecords && statusResponse.dnsRecords.length > 0) {
          console.log('Retrieved DNS records from status check:', statusResponse.dnsRecords);
          return {
            ...data,
            dnsRecords: statusResponse.dnsRecords,
            status: statusResponse.status || data.status
          };
        }
        
        // Wait between attempts
        if (i < 2) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    // Return the response data directly if it's available
    if (data) {
      return data;
    }
    
    return {
      success: false,
      message: 'Invalid response from server',
    };
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
    
    // Call the Supabase function to manually verify a domain
    const { data, error } = await supabase.functions.invoke('manage-email-domains', {
      body: { action: 'verify', domain }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(error.message);
    }
    
    // Add debug logging
    console.log('Verify domain response:', data);
    
    // If verification didn't return DNS records, try to get them
    if (data && data.success && (!data.dnsRecords || data.dnsRecords.length === 0)) {
      console.log('No DNS records returned in verification, trying to retrieve them...');
      
      // Try to get DNS records through status check
      const statusResponse = await checkDomainStatus(domain);
      
      if (statusResponse.success && statusResponse.dnsRecords && statusResponse.dnsRecords.length > 0) {
        console.log('Retrieved DNS records from status check:', statusResponse.dnsRecords);
        return {
          ...data,
          dnsRecords: statusResponse.dnsRecords
        };
      }
    }
    
    // Return the response data directly if it's available
    if (data) {
      return data;
    }
    
    return {
      success: false,
      message: 'Invalid response from server',
    };
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
    
    // Call the Supabase function to check domain verification status
    const { data, error } = await supabase.functions.invoke('manage-email-domains', {
      body: { action: 'status', domain }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(error.message);
    }
    
    // Add debug logging
    console.log('Check domain status response:', data);
    
    // If status check didn't return DNS records but we have a status, try the verify endpoint
    if (data && data.success && data.status && (!data.dnsRecords || data.dnsRecords.length === 0)) {
      console.log('Status check successful but no DNS records, trying verification endpoint...');
      
      // Try to get DNS records through verify endpoint
      try {
        const verifyResponse = await verifyDomain(domain);
        
        if (verifyResponse.success && verifyResponse.dnsRecords && verifyResponse.dnsRecords.length > 0) {
          console.log('Retrieved DNS records from verify endpoint:', verifyResponse.dnsRecords);
          return {
            ...data,
            dnsRecords: verifyResponse.dnsRecords
          };
        }
      } catch (verifyError) {
        console.error('Error getting DNS records from verify endpoint:', verifyError);
        // Continue with original response if verification fails
      }
    }
    
    // Return the response data directly if it's available
    if (data) {
      return data;
    }
    
    return {
      success: false,
      message: 'Invalid response from server',
    };
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
    
    // Call the Supabase function to remove a domain
    const { data, error } = await supabase.functions.invoke('manage-email-domains', {
      body: { action: 'remove', domain }
    });

    if (error) {
      console.error('Supabase function error:', error);
      throw new Error(error.message);
    }
    
    // Add more detailed logging
    console.log('Remove domain response:', data);
    
    // Return the response data directly if it's available
    if (data) {
      return data;
    }
    
    return {
      success: false,
      message: 'Invalid response from server',
    };
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
    
    // Call the Supabase function to get all user domains
    const { data, error } = await supabase.functions.invoke('manage-email-domains', {
      body: { action: 'list' }
    });

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
