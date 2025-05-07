import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send, Loader2, AlertTriangle, Info, Copy } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from "@/components/ui/select";
import { getUserDomains } from '@/utils/emailDomains';

// Define formatDate function at the top level
const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), "MMMM d, yyyy");
  } catch (error) {
    return dateString;
  }
};

export default function SendInvoicePage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const { getInvoice, getClient, updateInvoice, getUser } = useData();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testModeInfo, setTestModeInfo] = useState<string | null>(null);
  const [verifiedDomains, setVerifiedDomains] = useState<string[]>([]);
  const [isLoadingDomains, setIsLoadingDomains] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false); // Track if page is fully loaded

  const [emailData, setEmailData] = useState({
    to: '',
    subject: '',
    message: '',
    copy: true,
    markAsSent: true,
    fromDomain: '',
    fromName: '',
  });
  
  const [invoice, setInvoice] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const currentUser = getUser();

  // Load invoice data
  useEffect(() => {
    const initializeInvoice = () => {
      if (!invoiceId) {
        navigate('/invoices', { replace: true });
        return;
      }
      
      const invoiceData = getInvoice(invoiceId);
      if (!invoiceData) {
        navigate('/invoices', { replace: true });
        return;
      }
      
      setInvoice(invoiceData);
      
      const clientData = getClient(invoiceData.clientId);
      if (!clientData) {
        navigate('/invoices', { replace: true });
        return;
      }
      
      setClient(clientData);
    };
    
    initializeInvoice();
  }, [invoiceId, getInvoice, getClient, navigate]);
  
  // Load user's verified domains
  useEffect(() => {
    const loadVerifiedDomains = async () => {
      try {
        setIsLoadingDomains(true);
        const domains = await getUserDomains();
        
        console.log("Loaded domains:", domains);
        
        // Only set verified domains
        if (domains && domains.length > 0) {
          setVerifiedDomains(domains || []);
          
          // If we have verified domains, set the first one as default
          if (domains.length > 0) {
            setEmailData(prevData => ({
              ...prevData,
              fromDomain: domains[0] // Set the first domain as default
            }));
          }
        }
      } catch (error) {
        console.error("Error loading domains:", error);
        toast({
          title: "Error loading domains",
          description: "Could not load your verified domains. You can still send test emails.",
        });
      } finally {
        setIsLoadingDomains(false);
      }
    };
    
    loadVerifiedDomains();
  }, [toast]);
  
  // Initialize email data after client and invoice are loaded
  useEffect(() => {
    if (client && invoice && currentUser) {
      const formattedDate = formatDate(invoice.dueDate);
      
      setEmailData(prev => ({
        ...prev,
        to: client.email,
        subject: `Invoice #${invoice.invoiceNumber} from ${currentUser?.company || 'Your Company'}`,
        message: `Dear ${client.fullName},\n\nPlease find attached invoice #${invoice.invoiceNumber} for $${invoice.total.toFixed(2)}.\n\nPayment is due by ${formattedDate}.\n\nThank you for your business.\n\nSincerely,\n${currentUser?.fullName || 'Your Name'}\n${currentUser?.company || 'Your Company'}`,
        copy: true,
        markAsSent: true,
        fromDomain: prev.fromDomain || '',
        fromName: currentUser?.company || 'Your Company',
      }));
      
      setPageLoaded(true); // Mark page as loaded once all data is ready
    }
  }, [client, invoice, currentUser]);

  if (!pageLoaded) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Handle text inputs
    if (type !== 'checkbox') {
      setEmailData({
        ...emailData,
        [name]: value,
      });
    }
  };

  // Separate handler for checkbox changes
  const handleCheckboxChange = (name: string, checked: boolean) => {
    setEmailData({
      ...emailData,
      [name]: checked,
    });
  };
  
  // Handler for select changes
  const handleSelectChange = (name: string, value: string) => {
    setEmailData({
      ...emailData,
      [name]: value,
    });
    
    // Clear test mode info when domain changes
    if (name === 'fromDomain') {
      setTestModeInfo(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTestModeInfo(null);
    
    try {
      console.log("Sending invoice with domain:", emailData.fromDomain);
      
      // Send the invoice via Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('send-invoice', {
        body: {
          to: emailData.to,
          subject: emailData.subject,
          message: emailData.message,
          copy: emailData.copy,
          replyTo: currentUser?.email,
          invoiceNumber: invoice.invoiceNumber,
          clientName: client.fullName,
          amount: invoice.total,
          dueDate: formatDate(invoice.dueDate),
          fromDomain: emailData.fromDomain,
          fromName: emailData.fromName,
        }
      });

      console.log("Response from send-invoice:", data);

      if (error) {
        throw new Error(error.message);
      }

      // If API responded with success but we're in test mode
      if (data?.testMode) {
        const verifiedEmail = data?.recipient || "your verified email";
        setTestModeInfo(`Your email was sent in testing mode to ${verifiedEmail} instead of ${emailData.to}. To send emails directly to clients, verify your domain in the Settings > Email Domains section.`);
      }
      
      // If markAsSent is true, update the invoice status
      if (emailData.markAsSent && invoice.status === 'draft') {
        updateInvoice(invoice.id, { status: 'pending' });
      }
      
      toast({
        title: "Invoice sent",
        description: data?.usedCustomDomain 
          ? `Invoice #${invoice.invoiceNumber} has been sent to ${client.email} from ${data?.fromEmail}` 
          : `Invoice #${invoice.invoiceNumber} has been sent in testing mode to ${data?.recipient}`,
      });
      
      if (!data?.testMode && data?.usedCustomDomain) {
        // Only navigate away if not in test mode
        navigate(`/invoices/${invoice.id}`);
      }
    } catch (error: any) {
      console.error("Error sending invoice:", error);
      toast({
        title: "Error sending invoice",
        description: error.message || "An error occurred while sending the invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Send Invoice #{invoice?.invoiceNumber}
            </h1>
            <p className="text-muted-foreground">
              Send the invoice to {client?.fullName}
            </p>
          </div>
        </div>
        
        {verifiedDomains.length === 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>No Verified Domains</AlertTitle>
            <AlertDescription>
              You don't have any verified email domains yet. Emails will be sent in testing mode to your verified email address.
              To send emails directly to clients, <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/settings')}>add and verify your domain</Button>.
            </AlertDescription>
          </Alert>
        )}
        
        {testModeInfo && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Testing Mode Active</AlertTitle>
            <AlertDescription>
              {testModeInfo}
            </AlertDescription>
          </Alert>
        )}
        
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                {verifiedDomains.length > 0 && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="fromDomain">Send From Domain</Label>
                      <Select 
                        value={emailData.fromDomain} 
                        onValueChange={(value) => handleSelectChange('fromDomain', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a verified domain" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="test">Use test email address</SelectItem>
                          {verifiedDomains.map(domain => (
                            <SelectItem key={domain} value={domain}>{domain}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {emailData.fromDomain && emailData.fromDomain !== "test" && (
                      <div className="grid gap-2">
                        <Label htmlFor="fromName">From Name</Label>
                        <Input
                          id="fromName"
                          name="fromName"
                          value={emailData.fromName}
                          onChange={handleChange}
                          placeholder="Your Company Name"
                        />
                      </div>
                    )}
                  </div>
                )}
                
                <div className="grid gap-2">
                  <Label htmlFor="to">To</Label>
                  <Input
                    id="to"
                    name="to"
                    value={emailData.to}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    name="subject"
                    value={emailData.subject}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={emailData.message}
                    onChange={handleChange}
                    rows={8}
                    required
                  />
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="copy"
                      checked={emailData.copy}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange("copy", checked === true)
                      }
                    />
                    <Label htmlFor="copy">
                      Send me a copy
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="markAsSent"
                      checked={emailData.markAsSent}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange("markAsSent", checked === true)
                      }
                    />
                    <Label htmlFor="markAsSent">
                      Mark invoice as {invoice.status === 'draft' ? 'pending' : invoice.status}
                    </Label>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      {emailData.fromDomain && emailData.fromDomain !== "test" ? 'Send Invoice' : 'Send Test Email'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
