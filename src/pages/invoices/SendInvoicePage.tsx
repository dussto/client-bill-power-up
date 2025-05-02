
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export default function SendInvoicePage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const { getInvoice, getClient, updateInvoice, getUser } = useData();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailData, setEmailData] = useState({
    to: '',
    subject: '',
    message: '',
    copy: true,
    markAsSent: true,
  });
  
  const invoice = getInvoice(invoiceId || '');
  const [client, setClient] = useState<any>(null);
  const currentUser = getUser();
  
  useEffect(() => {
    if (!invoice) {
      navigate('/invoices', { replace: true });
      return;
    }
    
    const clientData = getClient(invoice.clientId);
    setClient(clientData);
    
    if (clientData) {
      const formattedDate = formatDate(invoice.dueDate);
      
      setEmailData({
        to: clientData.email,
        subject: `Invoice #${invoice.invoiceNumber} from Your Company`,
        message: `Dear ${clientData.fullName},\n\nPlease find attached invoice #${invoice.invoiceNumber} for $${invoice.total.toFixed(2)}.\n\nPayment is due by ${formattedDate}.\n\nThank you for your business.\n\nSincerely,\n${currentUser?.fullName || 'Your Name'}\n${currentUser?.company || 'Your Company'}`,
        copy: true,
        markAsSent: true,
      });
    }
  }, [invoice, navigate, getClient]);
  
  if (!invoice || !client) {
    return null;
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMMM d, yyyy");
    } catch (error) {
      return dateString;
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
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
          dueDate: formatDate(invoice.dueDate)
        }
      });

      if (error) {
        throw new Error(error.message);
      }
      
      // If markAsSent is true, update the invoice status
      if (emailData.markAsSent && invoice.status === 'draft') {
        updateInvoice(invoice.id, { status: 'pending' });
      }
      
      toast({
        title: "Invoice sent",
        description: `Invoice #${invoice.invoiceNumber} has been sent to ${emailData.to}`,
      });
      
      navigate(`/invoices/${invoice.id}`);
    } catch (error) {
      console.error("Error sending invoice:", error);
      toast({
        title: "Error sending invoice",
        description: "An error occurred while sending the invoice. Please try again.",
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
              Send Invoice #{invoice.invoiceNumber}
            </h1>
            <p className="text-muted-foreground">
              Send the invoice to {client.fullName}
            </p>
          </div>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
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
                      Send Invoice
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
