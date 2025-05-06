
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

// Helper function to get domain from email address
const getDomainFromEmail = (email: string) => {
  if (!email || !email.includes('@')) return null;
  return email.split('@')[1];
};

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
    
    // Check if we should use a custom domain
    if (fromDomain && fromDomain !== "test") {
      try {
        // Verify domain status with Resend
        const domainResponse = await resend.domains.get(fromDomain);
        console.log("Domain verification response:", JSON.stringify(domainResponse));
        
        if (domainResponse.data && domainResponse.data.status === 'verified') {
          // Use custom domain if it's verified
          const senderName = fromName || 'Invoice Service';
          fromEmail = `${senderName} <invoices@${fromDomain}>`;
          isUsingCustomDomain = true;
          console.log("Using verified custom domain:", fromDomain);
        } else {
          console.log("Domain is not verified yet:", fromDomain, "Status:", domainResponse?.data?.status);
          throw new Error(`Domain ${fromDomain} is not verified. Please verify it first before sending emails.`);
        }
      } catch (error) {
        console.error(`Custom domain validation failed: ${error instanceof Error ? error.message : String(error)}`);
        throw new Error(`Domain validation failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else if (fromDomain === "test") {
      // User explicitly selected test mode
      const verifiedEmail = Deno.env.get("RESEND_VERIFIED_EMAIL") || "onboarding@resend.dev";
      fromEmail = `Invoice Creator <${verifiedEmail}>`;
      console.log("Using test mode with address:", fromEmail);
    } else {
      // No domain provided
      throw new Error("You must select a verified domain to send emails directly to clients.");
    }

    // Set up email sending options
    const emailOptions: any = {
      from: fromEmail,
      to: isUsingCustomDomain ? to : Deno.env.get("RESEND_VERIFIED_EMAIL") || "onboarding@resend.dev",
      reply_to: replyTo,
      subject: isUsingCustomDomain ? subject : `${subject} (Originally to: ${to})`,
      html: htmlContent,
    };
    
    // Add CC to sender if requested
    if (copy && replyTo) {
      emailOptions.bcc = [replyTo];
    }

    // In testing mode, add a notice about it
    if (!isUsingCustomDomain) {
      emailOptions.html = `
        <div style="background-color: #ffffe0; padding: 10px; margin-bottom: 15px; border: 1px solid #e6db55; border-radius: 4px;">
          <strong>TESTING MODE:</strong> This email would have been sent to ${to}
        </div>
        ${htmlContent}
      `;
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
      message: isUsingCustomDomain ? 
        "Email sent successfully to client." : 
        "Email sent to your test email address. To send to actual clients, verify a domain in Resend.",
      recipient: emailOptions.to,
      originalRecipient: to,
      usedCustomDomain: isUsingCustomDomain,
      fromEmail: fromEmail
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
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
