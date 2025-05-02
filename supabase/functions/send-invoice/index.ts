
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@1.0.0";

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
  fromDomain?: string; // New optional parameter for sender domain
  fromName?: string;   // New optional parameter for sender name
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
    if (fromDomain) {
      try {
        // Verify domain status with Resend
        const domainResponse = await resend.domains.get(fromDomain);
        
        if (domainResponse.data && domainResponse.data.status === 'verified') {
          // Use custom domain if it's verified
          const senderName = fromName || 'Invoice Service';
          fromEmail = `${senderName} <invoices@${fromDomain}>`;
          isUsingCustomDomain = true;
        }
      } catch (error) {
        console.log(`Custom domain validation failed: ${error.message}. Falling back to default email.`);
      }
    }
    
    // Fall back to verified email if custom domain is not available
    if (!isUsingCustomDomain) {
      // Get the verified email from environment or fallback
      const verifiedEmail = Deno.env.get("RESEND_VERIFIED_EMAIL") || "onboarding@resend.dev";
      fromEmail = `Invoice Creator <${verifiedEmail}>`;
    }
    
    // Set up email sending options
    const emailOptions = {
      from: fromEmail,
      to: isUsingCustomDomain ? [to] : [Deno.env.get("RESEND_VERIFIED_EMAIL") || "onboarding@resend.dev"], // Only send to actual recipient if using verified domain
      reply_to: replyTo,
      subject: isUsingCustomDomain ? subject : `${subject} (Originally to: ${to})`,
      html: htmlContent,
    };
    
    // If we're using the testing mode (not a custom domain), add a notice about it
    if (!isUsingCustomDomain) {
      emailOptions.html = `
        <div style="background-color: #ffffe0; padding: 10px; margin-bottom: 15px; border: 1px solid #e6db55; border-radius: 4px;">
          <strong>TESTING MODE:</strong> This email would have been sent to ${to}
        </div>
        ${htmlContent}
      `;
    }

    // Add CC to sender if requested
    if (copy && replyTo) {
      emailOptions.bcc = [replyTo];
    }

    const emailResponse = await resend.emails.send(emailOptions);
    
    if (emailResponse.error) {
      throw new Error(emailResponse.error);
    }
    
    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({
      success: true,
      message: isUsingCustomDomain ? 
        "Email sent successfully to client." : 
        "Email sent to your test email address. To send to actual clients, verify a domain in Resend.",
      recipient: isUsingCustomDomain ? to : Deno.env.get("RESEND_VERIFIED_EMAIL") || "onboarding@resend.dev",
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
        error: error.message,
        hint: "If you're in testing mode, you need to verify a domain in Resend or set RESEND_VERIFIED_EMAIL to your verified email."
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
