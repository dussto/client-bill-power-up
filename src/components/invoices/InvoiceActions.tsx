
import { Link } from 'react-router-dom';
import { Check, Clock, Send, AlertTriangle, Loader2, Download, Edit, Link as LinkIcon, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Client, Invoice } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import { useState } from 'react';

interface InvoiceActionsProps {
  invoice: Invoice;
  client: Client;
  onMarkAsPaid: () => void;
  onMarkAsPending: () => void;
  onSendReminder: () => void;
  onDownloadPDF: () => void;
  isLoading: boolean;
  isGeneratingPDF: boolean;
}

const InvoiceActions = ({
  invoice,
  client,
  onMarkAsPaid,
  onMarkAsPending,
  onSendReminder,
  onDownloadPDF,
  isLoading,
  isGeneratingPDF
}: InvoiceActionsProps) => {
  const { toast } = useToast();
  const [isCopying, setIsCopying] = useState(false);

  const copyPaymentLink = async () => {
    setIsCopying(true);
    try {
      // Generate a payment link that would typically point to a Stripe checkout
      const origin = window.location.origin;
      const paymentLink = `${origin}/pay/${invoice.id}`;
      
      await navigator.clipboard.writeText(paymentLink);
      
      toast({
        title: "Payment link copied",
        description: "The payment link has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy the payment link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="text-lg font-medium">Actions</h3>
          
          <div className="space-y-3">
            <Button onClick={onDownloadPDF} className="w-full" disabled={isGeneratingPDF}>
              {isGeneratingPDF ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {isGeneratingPDF ? "Generating PDF..." : "Download Invoice PDF"}
            </Button>
          
            {invoice.status !== 'paid' && (
              <Button onClick={onMarkAsPaid} className="w-full">
                <Check className="h-4 w-4 mr-2" />
                Mark as Paid
              </Button>
            )}
            
            {invoice.status === 'paid' && (
              <Button onClick={onMarkAsPending} className="w-full" variant="outline">
                <Clock className="h-4 w-4 mr-2" />
                Mark as Pending
              </Button>
            )}
            
            <Button asChild className="w-full" variant="outline">
              <Link to={`/invoices/${invoice.id}/send`}>
                <Send className="h-4 w-4 mr-2" />
                Send Invoice
              </Link>
            </Button>
            
            <Button 
              onClick={copyPaymentLink} 
              className="w-full" 
              variant="outline"
              disabled={isCopying}
            >
              {isCopying ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <LinkIcon className="h-4 w-4 mr-2" />
              )}
              {isCopying ? "Copying..." : "Copy Payment Link"}
            </Button>
            
            {(invoice.status === 'pending' || invoice.status === 'overdue') && (
              <Button 
                onClick={onSendReminder} 
                className="w-full" 
                variant="outline"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <AlertTriangle className="h-4 w-4 mr-2" />
                )}
                {isLoading ? "Sending..." : "Send Reminder"}
              </Button>
            )}
            
            <Button asChild className="w-full" variant="outline">
              <Link to={`/invoices/${invoice.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Invoice
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Client</h3>
            
            <div className="space-y-2">
              <p className="font-medium">{client.fullName}</p>
              {client.companyName && <p>{client.companyName}</p>}
              <a
                href={`mailto:${client.email}`}
                className="text-primary hover:underline"
              >
                {client.email}
              </a>
              {client.phone && (
                <p>
                  <a href={`tel:${client.phone}`} className="hover:underline">
                    {client.phone}
                  </a>
                </p>
              )}
            </div>
            
            <Button asChild variant="outline" className="w-full">
              <Link to={`/clients/${client.id}`}>
                View Client Details
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceActions;
