
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

    // Get the user ID from the request
    const { userId } = await req.json();
    if (!userId) {
      throw new Error("User ID is required");
    }

    // Create a Stripe Connect account link for onboarding
    const account = await stripe.accounts.create({ type: "standard" });
    
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${req.headers.get("origin")}/settings`,
      return_url: `${req.headers.get("origin")}/settings?stripe_success=true`,
      type: "account_onboarding",
    });

    // Return the URL where the user should be redirected to continue the Stripe Connect onboarding
    return new Response(
      JSON.stringify({ 
        success: true, 
        url: accountLink.url,
        accountId: account.id 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Error in connect-stripe function:", error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
