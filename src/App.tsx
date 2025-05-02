
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";

// Public Pages
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import NotFound from "./pages/NotFound";

// Dashboard Pages
import DashboardPage from "./pages/dashboard/DashboardPage";
import ClientsPage from "./pages/clients/ClientsPage";
import NewClientPage from "./pages/clients/NewClientPage";
import EditClientPage from "./pages/clients/EditClientPage";
import ClientDetailPage from "./pages/clients/ClientDetailPage";
import InvoicesPage from "./pages/invoices/InvoicesPage";
import NewInvoicePage from "./pages/invoices/NewInvoicePage";
import EditInvoicePage from "./pages/invoices/EditInvoicePage";
import InvoiceDetailPage from "./pages/invoices/InvoiceDetailPage";
import SendInvoicePage from "./pages/invoices/SendInvoicePage";
import SettingsPage from "./pages/settings/SettingsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

              {/* Protected Dashboard Routes */}
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/clients/new" element={<NewClientPage />} />
              <Route path="/clients/:clientId" element={<ClientDetailPage />} />
              <Route path="/clients/:clientId/edit" element={<EditClientPage />} />
              <Route path="/invoices" element={<InvoicesPage />} />
              <Route path="/invoices/new" element={<NewInvoicePage />} />
              <Route path="/invoices/:invoiceId" element={<InvoiceDetailPage />} />
              <Route path="/invoices/:invoiceId/edit" element={<EditInvoicePage />} />
              <Route path="/invoices/:invoiceId/send" element={<SendInvoicePage />} />
              <Route path="/settings" element={<SettingsPage />} />

              {/* Catch All */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
