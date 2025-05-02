
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

    // Set up email sending options
    const emailOptions = {
      from: "Invoice Creator <onboarding@resend.dev>",
      to: [to],
      subject: subject,
      html: htmlContent,
    };

    // If copy is requested, add the sender as BCC
    if (copy && replyTo) {
      emailOptions["bcc"] = [replyTo];
    }

    // Add reply-to if provided
    if (replyTo) {
      emailOptions["reply_to"] = replyTo;
    }

    const emailResponse = await resend.emails.send(emailOptions);
    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("Error in send-invoice function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
