
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface SendInvoiceData {
  to: string;
  subject: string;
  message: string;
  copy: boolean;
  markAsSent: boolean;
  fromDomain: string;
  fromName: string;
}

interface UseSendInvoiceProps {
  invoice: any;
  client: any;
  currentUser: any;
  onSuccess: () => void;
  updateInvoice: (id: string, data: any) => void;
}

const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), "MMMM d, yyyy");
  } catch (error) {
    return dateString;
  }
};

export const useSendInvoice = ({ 
  invoice, 
  client, 
  currentUser, 
  onSuccess, 
  updateInvoice 
}: UseSendInvoiceProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testModeInfo, setTestModeInfo] = useState<string | null>(null);
  const { toast } = useToast();

  const sendInvoice = async (emailData: SendInvoiceData) => {
    setIsSubmitting(true);
    setTestModeInfo(null);
    
    try {
      console.log("Sending invoice with domain:", emailData.fromDomain);
      
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

      if (data?.testMode) {
        const verifiedEmail = data?.recipient || "your verified email";
        setTestModeInfo(`Your email was sent in testing mode to ${verifiedEmail} instead of ${emailData.to}. To send emails directly to clients, verify your domain in the Settings > Email Domains section.`);
      }
      
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
        onSuccess();
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

  return {
    sendInvoice,
    isSubmitting,
    testModeInfo,
    clearTestModeInfo: () => setTestModeInfo(null)
  };
};
