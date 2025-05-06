import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EmailDomainManager from '@/components/settings/EmailDomainManager';
import { Checkbox } from '@/components/ui/checkbox';
import { useData } from '@/context/DataContext';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { Textarea } from '@/components/ui/textarea';
import { EmailTemplate } from '@/context/DataContextTypes';
import PackageManager from '@/components/packages/PackageManager';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { invoiceSettings, updateInvoiceSettings } = useData();
  
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

  // Initialize form with values from context
  const [localInvoiceSettings, setLocalInvoiceSettings] = useState(invoiceSettings);

  // Update local form when context changes
  useEffect(() => {
    setLocalInvoiceSettings(invoiceSettings);
  }, [invoiceSettings]);

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

  const handleInvoiceSettingsChange = (e) => {
    const { name, value } = e.target;
    setLocalInvoiceSettings({
      ...localInvoiceSettings,
      [name]: value,
    });
  };

  const handleCheckboxChange = (checked) => {
    setLocalInvoiceSettings({
      ...localInvoiceSettings,
      isCompany: checked,
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

  const handleInvoiceSettingsSubmit = (e) => {
    e.preventDefault();
    // Update the invoice settings in the context
    updateInvoiceSettings(localInvoiceSettings);
    toast({
      title: "Invoice settings updated",
      description: "Your invoice settings have been updated successfully.",
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

  // Create a tab component for Email Templates
  const EmailTemplatesTab = () => {
    const { emailTemplates, updateEmailTemplate, addEmailTemplate, deleteEmailTemplate } = useData();
    const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
    const [editingTemplate, setEditingTemplate] = useState<Partial<EmailTemplate>>({});
    
    const handleSelectTemplate = (template: EmailTemplate) => {
      setSelectedTemplate(template);
      setEditingTemplate(template);
    };
    
    const handleUpdateTemplate = () => {
      if (selectedTemplate && (editingTemplate.subject || editingTemplate.body)) {
        updateEmailTemplate(selectedTemplate.id, editingTemplate);
        toast({
          title: "Template updated",
          description: `The ${selectedTemplate.name} template has been updated.`,
        });
      }
    };
    
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Email Templates</CardTitle>
            <CardDescription>
              Customize the email templates for different invoice actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Available Templates</h3>
                <div className="space-y-2">
                  {emailTemplates.map(template => (
                    <Button 
                      key={template.id}
                      variant={selectedTemplate?.id === template.id ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => handleSelectTemplate(template)}
                    >
                      {template.name}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="md:col-span-2">
                {selectedTemplate ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Edit Template: {selectedTemplate.name}</h3>
                    
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input 
                          id="subject"
                          value={editingTemplate.subject || ''}
                          onChange={(e) => setEditingTemplate({...editingTemplate, subject: e.target.value})}
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="body">Email Body</Label>
                        <Textarea 
                          id="body"
                          value={editingTemplate.body || ''}
                          onChange={(e) => setEditingTemplate({...editingTemplate, body: e.target.value})}
                          rows={10}
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <h4 className="font-medium">Available Variables</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="bg-muted p-2 rounded">{'{{invoiceNumber}}'}</div>
                          <div className="bg-muted p-2 rounded">{'{{companyName}}'}</div>
                          <div className="bg-muted p-2 rounded">{'{{clientName}}'}</div>
                          <div className="bg-muted p-2 rounded">{'{{amount}}'}</div>
                          <div className="bg-muted p-2 rounded">{'{{dueDate}}'}</div>
                          <div className="bg-muted p-2 rounded">{'{{userName}}'}</div>
                        </div>
                      </div>
                      
                      <Button onClick={handleUpdateTemplate}>
                        Save Template
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Select a template to edit</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
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
        
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="email">Email Domains</TabsTrigger>
            <TabsTrigger value="email-templates">Email Templates</TabsTrigger>
            <TabsTrigger value="invoice">Invoice Settings</TabsTrigger>
            <TabsTrigger value="payment">Payment Settings</TabsTrigger>
            <TabsTrigger value="packages">Packages</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-6">
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
          </TabsContent>
          
          <TabsContent value="email">
            <EmailDomainManager />
          </TabsContent>
          
          <TabsContent value="email-templates">
            <EmailTemplatesTab />
          </TabsContent>
          
          <TabsContent value="invoice" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Settings</CardTitle>
                <CardDescription>
                  Configure your invoice details shown to clients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleInvoiceSettingsSubmit} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={localInvoiceSettings.fullName}
                      onChange={handleInvoiceSettingsChange}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={localInvoiceSettings.email}
                      onChange={handleInvoiceSettingsChange}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={localInvoiceSettings.phone}
                      onChange={handleInvoiceSettingsChange}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      name="address"
                      value={localInvoiceSettings.address}
                      onChange={handleInvoiceSettingsChange}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2 pb-2">
                    <Checkbox 
                      id="isCompany" 
                      checked={localInvoiceSettings.isCompany}
                      onCheckedChange={handleCheckboxChange}
                    />
                    <Label htmlFor="isCompany">This is a company</Label>
                  </div>
                  
                  {localInvoiceSettings.isCompany && (
                    <div className="grid gap-2">
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        name="companyName"
                        value={localInvoiceSettings.companyName}
                        onChange={handleInvoiceSettingsChange}
                      />
                    </div>
                  )}
                  
                  <div className="grid gap-2">
                    <Label htmlFor="logo">Logo URL</Label>
                    <Input
                      id="logo"
                      name="logo"
                      placeholder="https://your-logo-url.com/logo.png"
                      value={localInvoiceSettings.logo}
                      onChange={handleInvoiceSettingsChange}
                    />
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-4">
                    <h4 className="font-medium">Invoice Numbering</h4>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="invoicePrefix">Invoice Prefix (3 characters)</Label>
                      <Input
                        id="invoicePrefix"
                        name="invoicePrefix"
                        maxLength={3}
                        value={localInvoiceSettings.invoicePrefix}
                        onChange={handleInvoiceSettingsChange}
                      />
                      <p className="text-sm text-muted-foreground">
                        The prefix will be added before the invoice number (e.g., INV-2025-001)
                      </p>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label>Numbering Scheme</Label>
                      <div className="flex gap-4">
                        <div className="flex items-center space-x-2">
                          <input 
                            type="radio" 
                            id="yearNumber" 
                            name="invoiceNumberingScheme" 
                            value="year-number"
                            checked={localInvoiceSettings.invoiceNumberingScheme === 'year-number'}
                            onChange={handleInvoiceSettingsChange} 
                          />
                          <Label htmlFor="yearNumber">Year-Number (e.g., INV-2025-001)</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <input 
                            type="radio" 
                            id="random" 
                            name="invoiceNumberingScheme" 
                            value="random"
                            checked={localInvoiceSettings.invoiceNumberingScheme === 'random'}
                            onChange={handleInvoiceSettingsChange} 
                          />
                          <Label htmlFor="random">Random (e.g., INV-A7B3C2)</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button type="submit">Save Invoice Settings</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="payment" className="space-y-6">
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
          </TabsContent>
          
          <TabsContent value="packages">
            <PackageManager />
          </TabsContent>
          
          <TabsContent value="account" className="space-y-6">
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
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
