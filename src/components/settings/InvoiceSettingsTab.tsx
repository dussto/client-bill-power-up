
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { useData } from '@/context/DataContext';

export function InvoiceSettingsTab() {
  const { toast } = useToast();
  const { invoiceSettings, updateInvoiceSettings } = useData();
  
  // Initialize form with values from context
  const [localInvoiceSettings, setLocalInvoiceSettings] = useState(invoiceSettings);

  // Update local form when context changes
  useEffect(() => {
    setLocalInvoiceSettings(invoiceSettings);
  }, [invoiceSettings]);

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

  const handleInvoiceSettingsSubmit = (e) => {
    e.preventDefault();
    // Update the invoice settings in the context
    updateInvoiceSettings(localInvoiceSettings);
    toast({
      title: "Invoice settings updated",
      description: "Your invoice settings have been updated successfully.",
    });
  };

  return (
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
  );
}
