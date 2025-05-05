
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Send, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Invoice } from '@/types';

interface InvoiceHeaderProps {
  invoice: Invoice;
  onDownloadPDF: () => void;
  isGeneratingPDF: boolean;
}

export function getStatusBadge(status: string) {
  switch (status) {
    case 'paid':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>;
    case 'pending':
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
    case 'overdue':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Overdue</Badge>;
    case 'draft':
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Draft</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

export function formatDate(dateString: string) {
  try {
    return format(new Date(dateString), "MMM d, yyyy");
  } catch (error) {
    return dateString;
  }
}

const InvoiceHeader = ({ invoice, onDownloadPDF, isGeneratingPDF }: InvoiceHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Invoice #{invoice.invoiceNumber}
            </h1>
            {getStatusBadge(invoice.status)}
          </div>
          <p className="text-muted-foreground">
            Issued on {formatDate(invoice.issueDate)} • Due on {formatDate(invoice.dueDate)}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onDownloadPDF} disabled={isGeneratingPDF}>
          {isGeneratingPDF ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          {isGeneratingPDF ? "Generating..." : "Download PDF"}
        </Button>
        <Button variant="outline" asChild>
          <Link to={`/invoices/${invoice.id}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Link>
        </Button>
        <Button asChild>
          <Link to={`/invoices/${invoice.id}/send`}>
            <Send className="h-4 w-4 mr-2" />
            Send Invoice
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default InvoiceHeader;
