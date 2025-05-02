
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '@/context/DataContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardStats() {
  const { invoices, clients } = useData();
  const [stats, setStats] = useState({
    totalInvoices: 0,
    paidInvoices: 0,
    pendingInvoices: 0,
    overdueInvoices: 0,
    totalRevenue: 0,
    pendingRevenue: 0,
  });
  const [chartData, setChartData] = useState<Array<{ name: string; amount: number }>>([]);

  useEffect(() => {
    // Calculate stats
    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
    const pendingInvoices = invoices.filter(inv => inv.status === 'pending').length;
    const overdueInvoices = invoices.filter(inv => inv.status === 'overdue').length;
    
    const totalRevenue = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.total, 0);
    
    const pendingRevenue = invoices
      .filter(inv => inv.status === 'pending' || inv.status === 'overdue')
      .reduce((sum, inv) => sum + inv.total, 0);

    setStats({
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      totalRevenue,
      pendingRevenue,
    });

    // Prepare chart data - last 6 invoices by date
    const sortedInvoices = [...invoices]
      .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
      .slice(0, 6)
      .reverse();
    
    const chartData = sortedInvoices.map(inv => {
      const client = clients.find(c => c.id === inv.clientId);
      return {
        name: client ? client.fullName.split(' ')[0] : 'Unknown',
        amount: inv.total,
      };
    });

    setChartData(chartData);
  }, [invoices, clients]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalInvoices}</div>
          <p className="text-xs text-muted-foreground">
            {stats.paidInvoices} paid, {stats.pendingInvoices} pending, {stats.overdueInvoices} overdue
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Revenue</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <rect width="20" height="14" x="2" y="5" rx="2" />
            <path d="M2 10h20" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            ${stats.pendingRevenue.toFixed(2)} pending
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Clients</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{clients.length}</div>
          <p className="text-xs text-muted-foreground">
            Active clients
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Invoice</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${stats.totalInvoices > 0
              ? (invoices.reduce((sum, inv) => sum + inv.total, 0) / stats.totalInvoices).toFixed(2)
              : '0.00'}
          </div>
          <p className="text-xs text-muted-foreground">
            Per invoice
          </p>
        </CardContent>
      </Card>
      
      {/* Chart */}
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
          <CardDescription>
            Recent invoice amounts by client
          </CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <div className="h-80 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">No invoice data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
