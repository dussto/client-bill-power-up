
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { getUserDomains } from '@/utils/emailDomains';
import EmailDomainSelector from './EmailDomainSelector';
import EmailFormFields from './EmailFormFields';
import SendInvoiceActions from './SendInvoiceActions';
import { useSendInvoice } from '@/hooks/useSendInvoice';

interface SendInvoiceFormProps {
  invoice: any;
  client: any;
  currentUser: any;
  updateInvoice: (id: string, data: any) => void;
}

const formatDate = (dateString: string) => {
  try {
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }).format(new Date(dateString));
  } catch (error) {
    return dateString;
  }
};

export default function SendInvoiceForm({
  invoice,
  client,
  currentUser,
  updateInvoice
}: SendInvoiceFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [verifiedDomains, setVerifiedDomains] = useState<string[]>([]);
  const [isLoadingDomains, setIsLoadingDomains] = useState(false);
  
  const [emailData, setEmailData] = useState({
    to: '',
    subject: '',
    message: '',
    copy: true,
    markAsSent: true,
    fromDomain: '',
    fromName: '',
  });

  const { sendInvoice, isSubmitting, testModeInfo, clearTestModeInfo } = useSendInvoice({
    invoice,
    client,
    currentUser,
    onSuccess: () => navigate(`/invoices/${invoice.id}`),
    updateInvoice
  });

  // Load user's verified domains
  useEffect(() => {
    const loadVerifiedDomains = async () => {
      try {
        setIsLoadingDomains(true);
        const domains = await getUserDomains();
        
        console.log("Loaded domains:", domains);
        
        if (domains && domains.length > 0) {
          setVerifiedDomains(domains || []);
          
          if (domains.length > 0) {
            setEmailData(prevData => ({
              ...prevData,
              fromDomain: domains[0]
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
  
  // Initialize email data
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
    }
  }, [client, invoice, currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type !== 'checkbox') {
      setEmailData({
        ...emailData,
        [name]: value,
      });
    }
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setEmailData({
      ...emailData,
      [name]: checked,
    });
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setEmailData({
      ...emailData,
      [name]: value,
    });
    
    if (name === 'fromDomain') {
      clearTestModeInfo();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendInvoice(emailData);
  };

  return (
    <div className="space-y-6">
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
              <EmailDomainSelector
                verifiedDomains={verifiedDomains}
                fromDomain={emailData.fromDomain}
                fromName={emailData.fromName}
                onDomainChange={(value) => handleSelectChange('fromDomain', value)}
                onNameChange={handleChange}
              />
              
              <EmailFormFields
                emailData={emailData}
                invoiceStatus={invoice.status}
                onChange={handleChange}
                onCheckboxChange={handleCheckboxChange}
              />
            </div>
            
            <SendInvoiceActions
              isSubmitting={isSubmitting}
              fromDomain={emailData.fromDomain}
              onCancel={() => navigate(-1)}
            />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
