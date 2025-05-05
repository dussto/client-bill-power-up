
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useData } from '@/context/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import InvoiceHeader from '@/components/invoices/InvoiceHeader';
import InvoiceContent from '@/components/invoices/InvoiceContent';
import InvoiceActions from '@/components/invoices/InvoiceActions';
import { generatePDF } from '@/utils/pdf-service';

export default function InvoiceDetailPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const { getInvoice, getClient, updateInvoice, getUser } = useData();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const invoice = getInvoice(invoiceId || '');
  const [client, setClient] = useState(null);
  const currentUser = getUser();
  const invoiceRef = useRef(null);
  
  useEffect(() => {
    if (!invoice) {
      navigate('/invoices', { replace: true });
      return;
    }
    
    setClient(getClient(invoice.clientId));
  }, [invoice, navigate, getClient]);
  
  if (!invoice || !client) {
    return null;
  }

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    
    setIsGeneratingPDF(true);
    
    try {
      await generatePDF(
        invoiceRef.current, 
        `Invoice-${invoice.invoiceNumber}.pdf`
      );
      
      toast({
        title: "PDF Downloaded",
        description: `Invoice #${invoice.invoiceNumber} has been downloaded as PDF.`,
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error generating PDF",
        description: "An error occurred while generating the PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleMarkAsPaid = () => {
    updateInvoice(invoice.id, { status: 'paid' });
    toast({
      title: "Invoice marked as paid",
      description: `Invoice #${invoice.invoiceNumber} has been marked as paid`,
    });
  };

  const handleMarkAsPending = () => {
    updateInvoice(invoice.id, { status: 'pending' });
    toast({
      title: "Invoice status updated",
      description: `Invoice #${invoice.invoiceNumber} has been marked as pending`,
    });
  };

  const handleSendReminder = async () => {
    setIsLoading(true);
    
    try {
      const formattedDate = format(new Date(invoice.dueDate), "MMMM d, yyyy");
      const subject = `Reminder: Invoice #${invoice.invoiceNumber} Payment Due`;
      const message = `Dear ${client.fullName},\n\nThis is a friendly reminder that payment for invoice #${invoice.invoiceNumber} in the amount of $${invoice.total.toFixed(2)} is due on ${formattedDate}.\n\nIf you have already made the payment, please disregard this message.\n\nThank you for your business.\n\nSincerely,\n${currentUser?.fullName || 'Your Name'}\n${currentUser?.company || 'Your Company'}`;
      
      // Send the reminder via Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('send-invoice', {
        body: {
          to: client.email,
          subject: subject,
          message: message,
          copy: true,
          replyTo: currentUser?.email,
          invoiceNumber: invoice.invoiceNumber,
          clientName: client.fullName,
          amount: invoice.total,
          dueDate: formattedDate
        }
      });

      if (error) {
        throw new Error(error.message);
      }
      
      toast({
        title: "Payment reminder sent",
        description: `A payment reminder for invoice #${invoice.invoiceNumber} has been sent to ${client.email}`,
      });
    } catch (error) {
      console.error("Error sending reminder:", error);
      toast({
        title: "Error sending reminder",
        description: "An error occurred while sending the payment reminder. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <InvoiceHeader 
          invoice={invoice}
          onDownloadPDF={handleDownloadPDF}
          isGeneratingPDF={isGeneratingPDF}
        />
        
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <InvoiceContent 
              ref={invoiceRef}
              invoice={invoice}
              client={client}
              currentUser={currentUser}
            />
          </div>
          
          <InvoiceActions 
            invoice={invoice}
            client={client}
            onMarkAsPaid={handleMarkAsPaid}
            onMarkAsPending={handleMarkAsPending}
            onSendReminder={handleSendReminder}
            onDownloadPDF={handleDownloadPDF}
            isLoading={isLoading}
            isGeneratingPDF={isGeneratingPDF}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
