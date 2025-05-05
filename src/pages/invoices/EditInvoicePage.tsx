
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import InvoiceForm from '@/components/invoices/InvoiceForm';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function EditInvoicePage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const { getInvoice, deleteInvoice } = useData();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const invoice = getInvoice(invoiceId || '');
  
  useEffect(() => {
    if (!invoice) {
      navigate('/invoices', { replace: true });
    }
  }, [invoice, navigate]);
  
  const handleDeleteInvoice = () => {
    if (invoiceId) {
      deleteInvoice(invoiceId);
      toast({
        title: "Invoice deleted",
        description: `Invoice #${invoice?.invoiceNumber} has been deleted.`,
      });
      navigate('/invoices');
    }
  };
  
  if (!invoice) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Edit Invoice</h1>
              <p className="text-muted-foreground">
                Update invoice #{invoice.invoiceNumber}
              </p>
            </div>
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Invoice
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete invoice
                  #{invoice.invoiceNumber} and remove it from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteInvoice}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        
        <InvoiceForm invoice={invoice} />
      </div>
    </DashboardLayout>
  );
}
