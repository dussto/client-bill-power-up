
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@1.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DomainRequest {
  action: 'add' | 'remove' | 'status' | 'list';
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
          const response = await resend.domains.create({
            name: domain,
          });
          
          console.log("Add domain response:", JSON.stringify(response));
          
          if (response?.error) {
            console.error("Resend API error:", response.error);
            throw new Error(response.error.message || 'Error adding domain');
          }
          
          // Get the DNS records for verification
          let dnsRecords = [];
          try {
            const dnsResponse = await resend.domains.verify(domain);
            console.log("DNS verification response:", JSON.stringify(dnsResponse));
            
            if (dnsResponse?.data?.records) {
              dnsRecords = dnsResponse.data.records;
            }
          } catch (verifyError) {
            console.error("Error getting DNS records:", verifyError);
            // Continue even if getting DNS records fails
          }
          
          return new Response(JSON.stringify({
            success: true,
            message: `Domain ${domain} added successfully. Please add the DNS records to verify your domain.`,
            dnsRecords: dnsRecords,
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
          // Check domain status
          const domainResponse = await resend.domains.get(domain);
          console.log("Domain status response:", JSON.stringify(domainResponse));
          
          // Get DNS records if the domain exists
          let dnsRecords = [];
          let status = 'pending';
          
          if (domainResponse?.data) {
            status = domainResponse.data.status || 'pending';
          }
          
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
      
      case 'remove': {
        if (!domain) {
          throw new Error('Domain is required');
        }
        
        try {
          // Use the correct method to remove the domain
          const response = await resend.domains.remove(domain);
          console.log("Domain removal response:", JSON.stringify(response));
          
          // Check if there's an error in the response
          if (response?.error) {
            // If the error is about domain not found, we'll still return success
            // as the end result is what the user wanted (domain not in Resend)
            if (response.error.message?.includes("not found") || response.error.status === 404) {
              console.log("Domain not found in Resend, already removed or never existed");
              return new Response(JSON.stringify({
                success: true,
                message: `Domain ${domain} was removed or did not exist`,
              }), {
                status: 200,
                headers: { "Content-Type": "application/json", ...corsHeaders },
              });
            }
            
            // For other errors, return an error response
            console.error("Error removing domain:", response.error);
            throw new Error(response.error.message || 'Error removing domain');
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
          
          // Check if the error message indicates the domain was not found
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.includes("not found") || errorMessage.includes("404")) {
            // If the domain wasn't found, we can consider this a "success" from the user's perspective
            return new Response(JSON.stringify({
              success: true,
              message: `Domain ${domain} was removed or did not exist`,
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
