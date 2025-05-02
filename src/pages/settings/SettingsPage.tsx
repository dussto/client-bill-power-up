
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useState } from 'react';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    company: user?.company || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm({
      ...profileForm,
      [name]: value,
    });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm({
      ...passwordForm,
      [name]: value,
    });
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    // In a real app, this would update the profile
    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully.",
    });
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    // In a real app, this would update the password
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please ensure the new password and confirm password match.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Password updated",
      description: "Your password has been updated successfully.",
    });
    
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
        
        <Separator />
        
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={profileForm.fullName}
                    onChange={handleProfileChange}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={profileForm.email}
                    onChange={handleProfileChange}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    name="company"
                    value={profileForm.company}
                    onChange={handleProfileChange}
                  />
                </div>
                
                <Button type="submit">Save Changes</Button>
              </form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>
                Update your password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                  />
                </div>
                
                <Button type="submit">Update Password</Button>
              </form>
            </CardContent>
          </Card>
          
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
                <Button variant="outline" onClick={logout}>
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
        </div>
      </div>
    </DashboardLayout>
  );
}
