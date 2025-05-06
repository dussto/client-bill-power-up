
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';

export function AccountSettingsTab() {
  const { logout } = useAuth();
  const { toast } = useToast();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>
          Manage your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Danger Zone</h3>
          <p className="text-sm text-muted-foreground">
            Performing these actions will affect your account
          </p>
        </div>
        
        <div className="flex items-center justify-between border rounded-lg p-4 bg-muted/50">
          <div>
            <h4 className="font-medium">Log Out</h4>
            <p className="text-sm text-muted-foreground">
              Sign out of your account
            </p>
          </div>
          <Button variant="outline" onClick={logout} className="text-foreground">
            Log Out
          </Button>
        </div>
        
        <div className="flex items-center justify-between border rounded-lg p-4 bg-muted/50">
          <div>
            <h4 className="font-medium">Delete Account</h4>
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all your data
            </p>
          </div>
          <Button 
            variant="destructive" 
            onClick={() => {
              toast({
                title: "Account deletion not implemented",
                description: "This is a demo app, so account deletion is not implemented.",
              });
            }}
          >
            Delete Account
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
