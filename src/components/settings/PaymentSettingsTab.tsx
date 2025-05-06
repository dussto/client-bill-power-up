
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export function PaymentSettingsTab() {
  const { user } = useAuth();
  const { toast } = useToast();

  const connectStripe = async () => {
    try {
      toast({
        title: "Connecting to Stripe",
        description: "Initiating Stripe Connect integration...",
      });
      
      // In a real implementation, you would call a Supabase function to initiate Stripe Connect
      const { data, error } = await supabase.functions.invoke('connect-stripe', {
        body: { userId: user?.id },
      });
      
      if (error) {
        throw new Error(`Error connecting to Stripe: ${error.message}`);
      }
      
      if (data && data.url) {
        // Redirect to the Stripe Connect onboarding URL
        window.location.href = data.url;
      } else {
        // Fallback to documentation for now
        window.open('https://stripe.com/docs/connect/standard-accounts', '_blank');
      }
    } catch (error) {
      console.error("Stripe connection error:", error);
      toast({
        title: "Stripe Connection Failed",
        description: "There was an error connecting to Stripe. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Settings</CardTitle>
        <CardDescription>
          Connect your Stripe account to receive payments from clients
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-4 p-4 border rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Stripe Payments</h3>
              <p className="text-sm text-muted-foreground">
                Allow clients to pay invoices directly using credit cards
              </p>
            </div>
            <Button onClick={connectStripe}>
              Connect Stripe
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <h4 className="font-medium">Manual API Key Setup</h4>
          <p className="text-sm text-muted-foreground mb-2">
            If you prefer to manually set up Stripe, you can enter your API keys directly
          </p>
          <div className="grid gap-2">
            <Label htmlFor="stripePublishableKey">Stripe Publishable Key</Label>
            <Input
              id="stripePublishableKey"
              name="stripePublishableKey"
              placeholder="pk_test_..."
            />
          </div>
          
          <div className="grid gap-2 mt-2">
            <Label htmlFor="stripeSecretKey">Stripe Secret Key</Label>
            <Input
              id="stripeSecretKey"
              name="stripeSecretKey"
              type="password"
              placeholder="sk_test_..."
            />
          </div>
          
          <Button className="mt-2">Save API Keys</Button>
        </div>
      </CardContent>
    </Card>
  );
}
