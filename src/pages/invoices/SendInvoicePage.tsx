
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

export default function SendInvoicePage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const { getInvoice, getClient, updateInvoice } = useData();
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
  const [client, setClient] = useState(null);
  
  useEffect(() => {
    if (!invoice) {
      navigate('/invoices', { replace: true });
      return;
    }
    
    const clientData = getClient(invoice.clientId);
    setClient(clientData);
    
    if (clientData) {
      setEmailData({
        to: clientData.email,
        subject: `Invoice #${invoice.invoiceNumber} from Your Company`,
        message: `Dear ${clientData.fullName},\n\nPlease find attached invoice #${invoice.invoiceNumber} for $${invoice.total.toFixed(2)}.\n\nPayment is due by ${new Date(invoice.dueDate).toLocaleDateString()}.\n\nThank you for your business.\n\nSincerely,\nYour Name\nYour Company`,
        copy: true,
        markAsSent: true,
      });
    }
  }, [invoice, navigate, getClient]);
  
  if (!invoice || !client) {
    return null;
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEmailData({
      ...emailData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // In a real app, this would send the invoice via email
      
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
                      name="copy"
                      checked={emailData.copy}
                      onCheckedChange={(checked) =>
                        setEmailData({ ...emailData, copy: checked })
                      }
                    />
                    <Label htmlFor="copy">
                      Send me a copy
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="markAsSent"
                      name="markAsSent"
                      checked={emailData.markAsSent}
                      onCheckedChange={(checked) =>
                        setEmailData({ ...emailData, markAsSent: checked })
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
                  <Send className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Sending..." : "Send Invoice"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
