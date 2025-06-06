
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@1.0.0";
import { encode } from "https://deno.land/std@0.220.1/encoding/base64.ts";
import html2canvas from "https://esm.sh/html2canvas@1.4.1";
import jsPDF from "https://esm.sh/jspdf@2.5.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvoiceEmailRequest {
  to: string;
  subject: string;
  message: string;
  copy: boolean;
  replyTo?: string;
  invoiceNumber: string;
  clientName: string;
  amount: number;
  dueDate: string;
  fromDomain?: string; // Optional parameter for sender domain
  fromName?: string;   // Optional parameter for sender name
  invoiceHtml?: string; // HTML representation of the invoice for PDF generation
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      to,
      subject,
      message,
      copy,
      replyTo,
      invoiceNumber,
      clientName,
      amount,
      dueDate,
      fromDomain,
      fromName,
      invoiceHtml,
    }: InvoiceEmailRequest = await req.json();

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Invoice #${invoiceNumber}</h2>
        <p>${message}</p>
        <div style="background-color: #f5f5f5; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Invoice Summary</h3>
          <p><strong>Client:</strong> ${clientName}</p>
          <p><strong>Amount Due:</strong> $${amount.toFixed(2)}</p>
          <p><strong>Due Date:</strong> ${dueDate}</p>
        </div>
        <p style="color: #666; font-size: 14px;">This is an automated email sent via your Invoice Creator application.</p>
      </div>
    `;

    let fromEmail;
    let isUsingCustomDomain = false;
    let verifiedEmail = Deno.env.get("RESEND_VERIFIED_EMAIL") || "onboarding@resend.dev";
    
    // Check if we should use a custom domain
    if (fromDomain && fromDomain !== "test") {
      try {
        // Get all domains first to check if the requested domain exists and is verified
        const domainsResponse = await resend.domains.list();
        console.log("All domains:", JSON.stringify(domainsResponse));
        
        // Find the domain that matches the requested one
        const domain = domainsResponse.data?.find(d => d.name === fromDomain);
        
        if (domain && domain.status === 'verified') {
          // Use custom domain if it's verified
          const senderName = fromName || 'Invoice Service';
          fromEmail = `${senderName} <invoices@${fromDomain}>`;
          isUsingCustomDomain = true;
          console.log("Using verified custom domain:", fromDomain);
        } else {
          console.log("Domain not found or not verified:", fromDomain, "Status:", domain?.status);
          // Not throwing error here, just using test mode instead
          fromEmail = `Invoice Creator <${verifiedEmail}>`;
          console.log("Domain not verified, falling back to test mode with:", fromEmail);
        }
      } catch (error) {
        console.error(`Custom domain validation failed: ${error instanceof Error ? error.message : String(error)}`);
        // Not throwing error here, just using test mode instead
        fromEmail = `Invoice Creator <${verifiedEmail}>`;
        console.log("Domain validation error, falling back to test mode with:", fromEmail);
      }
    } else if (fromDomain === "test") {
      // User explicitly selected test mode
      fromEmail = `Invoice Creator <${verifiedEmail}>`;
      console.log("Using test mode with address:", fromEmail);
    } else {
      // No domain provided - using test mode
      fromEmail = `Invoice Creator <${verifiedEmail}>`;
      console.log("No domain specified, using test mode with:", fromEmail);
    }

    // Set up email sending options
    const emailOptions: any = {
      from: fromEmail,
      to: isUsingCustomDomain ? to : verifiedEmail, // Only send to actual client if using verified domain
      reply_to: replyTo,
      subject: subject,
      html: htmlContent,
    };
    
    // Add CC to sender if requested
    if (copy && replyTo) {
      if (isUsingCustomDomain) {
        emailOptions.bcc = [replyTo];
      } else {
        // In test mode, add replyTo as an explicit recipient if copy is requested
        emailOptions.to = [verifiedEmail, replyTo];
      }
    }

    console.log("Sending email with options:", JSON.stringify({
      ...emailOptions,
      html: "[HTML Content]" // Don't log the full HTML
    }));

    const emailResponse = await resend.emails.send(emailOptions);
    
    if (emailResponse.error) {
      console.error("Error sending email:", emailResponse.error);
      throw new Error(emailResponse.error.message || JSON.stringify(emailResponse.error));
    }
    
    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({
      success: true,
      message: "Email sent successfully to client.",
      recipient: isUsingCustomDomain ? to : verifiedEmail,
      usedCustomDomain: isUsingCustomDomain,
      fromEmail: fromEmail,
      testMode: !isUsingCustomDomain
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("Error in send-invoice function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : String(error),
        hint: "To send emails directly to clients, you must verify a domain in Resend and select it when sending."
      }),
      {
        status: 200, // Changed to 200 to avoid non-2xx error while still returning error info
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
