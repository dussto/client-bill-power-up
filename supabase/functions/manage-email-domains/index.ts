
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@1.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DomainRequest {
  action: 'add' | 'remove' | 'status' | 'list' | 'verify';
  domain?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, domain } = await req.json() as DomainRequest;

    // Get user information from the JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Handle the different domain management actions
    switch (action) {
      case 'add': {
        if (!domain) {
          throw new Error('Domain is required');
        }
        
        try {
          // Call Resend API to add domain
          console.log(`Adding domain: ${domain}`);
          const response = await resend.domains.create({
            name: domain,
          });
          
          console.log("Add domain response:", JSON.stringify(response));
          
          if (response?.error) {
            console.error("Resend API error:", response.error);
            throw new Error(response.error.message || 'Error adding domain');
          }
          
          // Introduce a small delay to allow Resend to process the domain creation
          // This helps ensure DNS records are available when we query for them
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Get the DNS records for verification immediately after adding
          try {
            console.log(`Fetching DNS records for domain: ${domain}`);
            const dnsResponse = await resend.domains.verify(domain);
            console.log("DNS verification response:", JSON.stringify(dnsResponse));
            
            if (dnsResponse?.data?.records) {
              return new Response(JSON.stringify({
                success: true,
                message: `Domain ${domain} added successfully. Please add the DNS records to verify your domain.`,
                dnsRecords: dnsResponse.data.records,
                status: 'pending',
              }), {
                status: 200,
                headers: { "Content-Type": "application/json", ...corsHeaders },
              });
            } else {
              // Fallback: Try to get domain details directly which might include records
              console.log(`Attempting to get domain details for: ${domain}`);
              const domainDetails = await resend.domains.get(domain);
              console.log("Domain details response:", JSON.stringify(domainDetails));
              
              if (domainDetails?.data?.records) {
                return new Response(JSON.stringify({
                  success: true,
                  message: `Domain ${domain} added successfully. Please add the DNS records to verify your domain.`,
                  dnsRecords: domainDetails.data.records,
                  status: domainDetails.data.status || 'pending',
                }), {
                  status: 200,
                  headers: { "Content-Type": "application/json", ...corsHeaders },
                });
              }
            }
          } catch (verifyError) {
            console.error("Error getting DNS records:", verifyError);
            
            // One more attempt - get domain from list
            try {
              console.log("Attempting to get domain records from domains list");
              const listResponse = await resend.domains.list();
              const addedDomain = listResponse?.data?.find(d => d.name === domain);
              
              if (addedDomain?.id) {
                const domainDetails = await resend.domains.get(addedDomain.id);
                console.log("Domain details from list:", JSON.stringify(domainDetails));
                
                if (domainDetails?.data?.records) {
                  return new Response(JSON.stringify({
                    success: true,
                    message: `Domain ${domain} added successfully. Please add the DNS records to verify your domain.`,
                    dnsRecords: domainDetails.data.records,
                    status: domainDetails.data.status || 'pending',
                  }), {
                    status: 200,
                    headers: { "Content-Type": "application/json", ...corsHeaders },
                  });
                }
              }
            } catch (listError) {
              console.error("Error getting domain from list:", listError);
            }
          }
          
          // If we couldn't get DNS records, return a response without them
          return new Response(JSON.stringify({
            success: true,
            message: `Domain ${domain} added successfully but couldn't fetch DNS records. Please check domain status.`,
            status: 'pending',
          }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        } catch (error) {
          console.error("Error adding domain:", error);
          return new Response(JSON.stringify({
            success: false,
            message: `Failed to add domain: ${error instanceof Error ? error.message : String(error)}`,
          }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
      }
      
      case 'status': {
        if (!domain) {
          throw new Error('Domain is required');
        }

        try {
          console.log(`Checking status for domain: ${domain}`);
          
          // First, get the domain ID from the list
          const listResponse = await resend.domains.list();
          console.log("Domains list response:", JSON.stringify(listResponse));
          
          const domainData = listResponse?.data?.find(d => d.name === domain);
          
          if (!domainData) {
            return new Response(JSON.stringify({
              success: false,
              message: `Domain ${domain} not found`,
            }), {
              status: 404,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            });
          }
          
          // Check domain status using ID
          const domainResponse = await resend.domains.get(domainData.id);
          console.log("Domain status response:", JSON.stringify(domainResponse));
          
          // Get DNS records if the domain exists
          let dnsRecords = [];
          let status = 'pending';
          
          if (domainResponse?.data) {
            status = domainResponse.data.status || 'pending';
            
            // If records are available in the domain details
            if (domainResponse.data.records) {
              dnsRecords = domainResponse.data.records;
            } else {
              // Try to get DNS records from verify endpoint
              try {
                const verifyResponse = await resend.domains.verify(domain);
                console.log("Verification response:", JSON.stringify(verifyResponse));
                
                if (verifyResponse?.data?.records) {
                  dnsRecords = verifyResponse.data.records;
                }
              } catch (verifyError) {
                console.error("Error verifying domain:", verifyError);
                // Continue even if verification fails
              }
            }
          }
          
          return new Response(JSON.stringify({
            success: true,
            message: `Domain status: ${status}`,
            status: status,
            dnsRecords: dnsRecords,
          }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        } catch (error) {
          console.error("Error checking domain status:", error);
          return new Response(JSON.stringify({
            success: false,
            message: `Failed to check domain status: ${error instanceof Error ? error.message : String(error)}`,
          }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
      }
      
      case 'verify': {
        if (!domain) {
          throw new Error('Domain is required');
        }
        
        try {
          console.log(`Manually verifying domain: ${domain}`);
          
          // First, get the domain ID from the list
          const listResponse = await resend.domains.list();
          console.log("Domains list for verification:", JSON.stringify(listResponse));
          
          const domainData = listResponse?.data?.find(d => d.name === domain);
          
          if (!domainData) {
            return new Response(JSON.stringify({
              success: false,
              message: `Domain ${domain} not found for verification`,
            }), {
              status: 404,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            });
          }
          
          // Manually request domain verification
          const verifyResponse = await resend.domains.verify(domain);
          console.log("Manual verification response:", JSON.stringify(verifyResponse));
          
          // Check the domain status after verification attempt
          const domainResponse = await resend.domains.get(domainData.id);
          console.log("Domain status after verification:", JSON.stringify(domainResponse));
          
          let status = 'pending';
          if (domainResponse?.data) {
            status = domainResponse.data.status || 'pending';
          }
          
          // Return DNS records if available
          let dnsRecords = [];
          if (verifyResponse?.data?.records) {
            dnsRecords = verifyResponse.data.records;
          } else if (domainResponse?.data?.records) {
            dnsRecords = domainResponse.data.records;
          }
          
          return new Response(JSON.stringify({
            success: true,
            message: `Domain verification attempted. Current status: ${status}`,
            status: status,
            dnsRecords: dnsRecords,
          }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        } catch (error) {
          console.error("Error in manual verification:", error);
          return new Response(JSON.stringify({
            success: false,
            message: `Failed to verify domain: ${error instanceof Error ? error.message : String(error)}`,
          }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
      }
      
      case 'remove': {
        if (!domain) {
          throw new Error('Domain is required');
        }
        
        try {
          console.log(`Removing domain: ${domain}`);
          
          // List all domains to find the domain ID
          const listResponse = await resend.domains.list();
          console.log("List domains response before removal:", JSON.stringify(listResponse));
          
          // Find the domain we want to remove
          const domainToRemove = listResponse?.data?.find(d => d.name === domain);
          
          if (!domainToRemove) {
            console.log(`Domain ${domain} not found in Resend account`);
            return new Response(JSON.stringify({
              success: true,
              message: `Domain ${domain} was already removed or did not exist`,
            }), {
              status: 200,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            });
          }
          
          // Remove domain using the domain ID
          console.log(`Found domain to remove: ${domainToRemove.id} (${domainToRemove.name})`);
          const response = await resend.domains.remove(domainToRemove.id);
          console.log("Domain removal response:", JSON.stringify(response));
          
          // Verify the domain is actually removed
          try {
            const verifyRemoved = await resend.domains.list();
            console.log("List domains response after removal:", JSON.stringify(verifyRemoved));
            const stillExists = verifyRemoved?.data?.some(d => d.name === domain);
            
            if (stillExists) {
              console.error("Domain still exists after removal attempt");
              return new Response(JSON.stringify({
                success: false,
                message: `Failed to remove domain ${domain} from Resend`,
              }), {
                status: 500,
                headers: { "Content-Type": "application/json", ...corsHeaders },
              });
            }
          } catch (verifyError) {
            console.error("Error verifying domain removal:", verifyError);
          }
          
          return new Response(JSON.stringify({
            success: true,
            message: `Domain ${domain} removed successfully`,
          }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        } catch (error) {
          console.error("Error removing domain:", error);
          
          // Check if the error is because the domain doesn't exist
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.includes("not found") || errorMessage.includes("404")) {
            return new Response(JSON.stringify({
              success: true,
              message: `Domain ${domain} was already removed or did not exist`,
            }), {
              status: 200,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            });
          }
          
          return new Response(JSON.stringify({
            success: false,
            message: `Failed to remove domain: ${errorMessage}`,
          }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
      }
      
      case 'list': {
        try {
          // List all domains for the user
          console.log("Listing domains");
          const response = await resend.domains.list();
          console.log("List domains response:", JSON.stringify(response));
          
          // Extract domain names from response
          const domains = response?.data ? response.data.map(domain => domain.name) : [];
          
          return new Response(JSON.stringify({
            success: true,
            domains: domains,
          }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        } catch (error) {
          console.error("Error listing domains:", error);
          return new Response(JSON.stringify({
            success: false,
            message: `Failed to list domains: ${error instanceof Error ? error.message : String(error)}`,
            domains: [],
          }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
      }
      
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error("Error in manage-email-domains function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        message: error instanceof Error ? error.message : "An unknown error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
