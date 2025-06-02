
import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EmailDomainManager from '@/components/settings/EmailDomainManager';
import PackageManager from '@/components/packages/PackageManager';
import { ProfileSettingsTab } from '@/components/settings/ProfileSettingsTab';
import { InvoiceSettingsTab } from '@/components/settings/InvoiceSettingsTab';
import { PaymentSettingsTab } from '@/components/settings/PaymentSettingsTab';
import { AccountSettingsTab } from '@/components/settings/AccountSettingsTab';
import { EmailTemplatesTab } from '@/components/settings/EmailTemplatesTab';
import { useAuth } from '@/context/AuthContext';

export default function SettingsPage() {
  const { isAdmin } = useAuth();

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
            {isAdmin && <TabsTrigger value="packages">Packages</TabsTrigger>}
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-6">
            <ProfileSettingsTab />
          </TabsContent>
          
          <TabsContent value="email">
            <EmailDomainManager />
          </TabsContent>
          
          <TabsContent value="email-templates">
            <EmailTemplatesTab />
          </TabsContent>
          
          <TabsContent value="invoice" className="space-y-6">
            <InvoiceSettingsTab />
          </TabsContent>
          
          <TabsContent value="payment" className="space-y-6">
            <PaymentSettingsTab />
          </TabsContent>
          
          {isAdmin && (
            <TabsContent value="packages">
              <PackageManager />
            </TabsContent>
          )}
          
          <TabsContent value="account" className="space-y-6">
            <AccountSettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
