
import { useState } from "react";
import { Link } from "react-router-dom";
import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Search, MoreHorizontal, FileText, Plus } from "lucide-react";
import { format } from "date-fns";

export default function InvoiceList() {
  const { invoices, clients } = useData();
  const [searchTerm, setSearchTerm] = useState("");

  const getClientName = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    return client ? client.fullName : "Unknown Client";
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (error) {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case "overdue":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Overdue</Badge>;
      case "draft":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Draft</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const searchLower = searchTerm.toLowerCase();
    const clientName = getClientName(invoice.clientId).toLowerCase();
    return (
      invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
      clientName.includes(searchLower)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search invoices..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button asChild>
          <Link to="/invoices/new">
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Link>
        </Button>
      </div>

      {invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No invoices yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first invoice to get started
          </p>
          <Button asChild>
            <Link to="/invoices/new">
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Link>
          </Button>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No invoices matching your search</p>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="hidden md:table-cell">Due Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <Link to={`/invoices/${invoice.id}`} className="font-medium hover:underline">
                      {invoice.invoiceNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{getClientName(invoice.clientId)}</TableCell>
                  <TableCell className="hidden md:table-cell">{formatDate(invoice.issueDate)}</TableCell>
                  <TableCell className="hidden md:table-cell">{formatDate(invoice.dueDate)}</TableCell>
                  <TableCell className="text-right font-medium">${invoice.total.toFixed(2)}</TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/invoices/${invoice.id}`}>View</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/invoices/${invoice.id}/edit`}>Edit</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/invoices/${invoice.id}/send`}>Send</Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
