
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
        
        // Call Resend API to add domain
        const response = await resend.domains.create({
          name: domain,
        });
        
        if (response.error) {
          throw new Error(response.error.message);
        }
        
        // Get the DNS records for verification
        const dnsResponse = await resend.domains.verify(domain);
        let dnsRecords = [];
        
        if (dnsResponse.data) {
          dnsRecords = dnsResponse.data.records;
        }
        
        return new Response(JSON.stringify({
          success: true,
          message: `Domain ${domain} added successfully. Please add the DNS records to verify your domain.`,
          dnsRecords: dnsRecords,
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      case 'status': {
        if (!domain) {
          throw new Error('Domain is required');
        }

        // Check domain status
        const domainResponse = await resend.domains.get(domain);
        
        if (domainResponse.error) {
          throw new Error(domainResponse.error.message);
        }
        
        // Get DNS records if the domain exists
        const verifyResponse = await resend.domains.verify(domain);
        
        const status = domainResponse.data?.status || 'pending';
        
        return new Response(JSON.stringify({
          success: true,
          message: `Domain status: ${status}`,
          status: status,
          dnsRecords: verifyResponse.data?.records || [],
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      case 'remove': {
        if (!domain) {
          throw new Error('Domain is required');
        }
        
        // Remove domain
        const response = await resend.domains.remove(domain);
        
        if (response.error) {
          throw new Error(response.error.message);
        }
        
        return new Response(JSON.stringify({
          success: true,
          message: `Domain ${domain} removed successfully`,
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      case 'list': {
        // List all domains for the user
        const response = await resend.domains.list();
        
        if (response.error) {
          throw new Error(response.error.message);
        }
        
        // Extract domain names from response
        const domains = response.data?.map(domain => domain.name) || [];
        
        return new Response(JSON.stringify({
          success: true,
          domains: domains,
        }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
      
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error("Error in manage-email-domains function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        message: error.message || "An unknown error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
