
import { Link } from "react-router-dom";
import { useState } from "react";
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
import { Search, MoreHorizontal, Users, Plus } from "lucide-react";
import { Client } from "@/types";

export default function ClientList() {
  const { clients, getClientInvoices } = useData();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredClients = clients.filter((client) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      client.fullName.toLowerCase().includes(searchLower) ||
      (client.companyName && client.companyName.toLowerCase().includes(searchLower)) ||
      client.email.toLowerCase().includes(searchLower)
    );
  });

  const getInvoiceCount = (clientId: string) => {
    return getClientInvoices(clientId).length;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search clients..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button asChild>
          <Link to="/clients/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </Link>
        </Button>
      </div>

      {clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No clients yet</h3>
          <p className="text-muted-foreground mb-4">
            Get started by adding your first client
          </p>
          <Button asChild>
            <Link to="/clients/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Link>
          </Button>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No clients matching your search</p>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead className="text-right">Invoices</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div>
                      <Link to={`/clients/${client.id}`} className="font-medium hover:underline">
                        {client.fullName}
                      </Link>
                      {client.companyName && (
                        <p className="text-sm text-muted-foreground">{client.companyName}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <a
                      href={`mailto:${client.email}`}
                      className="text-sm hover:underline text-muted-foreground"
                    >
                      {client.email}
                    </a>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {client.phone || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {getInvoiceCount(client.id)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/clients/${client.id}`}>View Details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/clients/${client.id}/edit`}>Edit</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/invoices/new?clientId=${client.id}`}>Create Invoice</Link>
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
