
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("Missing Stripe secret key. Please add STRIPE_SECRET_KEY to your Supabase secrets.");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get the invoice details from the request
    const { invoiceId, amount, customerEmail, invoiceNumber, description } = await req.json();
    
    if (!invoiceId || !amount || !customerEmail) {
      throw new Error("Missing required payment information");
    }

    console.log(`Creating payment session for invoice ${invoiceId} (${invoiceNumber})`);

    // Create a Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Invoice #${invoiceNumber || invoiceId}`,
              description: description || 'Invoice payment',
            },
            unit_amount: Math.round(amount * 100), // Stripe requires amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get("origin")}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/payment/cancel`,
      metadata: {
        invoiceId,
        invoiceNumber: invoiceNumber || '',
      },
    });

    console.log("Created checkout session:", session.id);

    // Return the session ID and URL
    return new Response(
      JSON.stringify({ 
        success: true, 
        sessionId: session.id,
        url: session.url
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Error in create-payment function:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
