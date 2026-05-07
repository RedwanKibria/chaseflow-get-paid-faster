import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useApp } from "@/context/AppContext";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import CreateInvoicePage from "./pages/CreateInvoicePage";
import MyInvoicesPage from "./pages/MyInvoicesPage";
import ActivityLogsPage from "./pages/ActivityLogsPage";
import ProPlanPage from "./pages/ProPlanPage";
import SettingsPage from "./pages/SettingsPage";
import AdminUserManagementPage from "./pages/AdminUserManagementPage";
import AdminSystemLogsPage from "./pages/AdminSystemLogsPage";
import AdminInvoiceReportsPage from "./pages/AdminInvoiceReportsPage";
import ReviewFeedbackPage from "./pages/ReviewFeedbackPage";
import AdminSurveyReportsPage from "./pages/AdminSurveyReportsPage";
import EmailDeliveryReportPage from "./pages/EmailDeliveryReportPage";
import AdminSchedulerReportPage from "./pages/AdminSchedulerReportPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children, permKey }: { children: React.ReactNode; permKey?: string }) {
  const { isAuthenticated, loading, isActive, permissions } = useApp();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isActive) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-bold text-foreground">Account Inactive</h2>
        <p className="text-muted-foreground">Your account has been deactivated. Please contact an administrator.</p>
      </div>
    </div>
  );
  if (permKey && permissions && !(permissions as any)[permKey]) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/dashboard" element={<ProtectedRoute permKey="dashboard"><DashboardPage /></ProtectedRoute>} />
      <Route path="/create-invoice" element={<ProtectedRoute permKey="create_invoice"><CreateInvoicePage type="regular" /></ProtectedRoute>} />
      <Route path="/create-invoice-hourly" element={<ProtectedRoute permKey="create_invoice"><CreateInvoicePage type="hourly" /></ProtectedRoute>} />
      <Route path="/invoices" element={<ProtectedRoute permKey="my_invoices"><MyInvoicesPage /></ProtectedRoute>} />
      <Route path="/activity" element={<ProtectedRoute permKey="activity_logs"><ActivityLogsPage /></ProtectedRoute>} />
      <Route path="/pro" element={<ProtectedRoute permKey="pro_plan"><ProPlanPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute permKey="settings"><SettingsPage /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute permKey="admin_user_management"><AdminUserManagementPage /></ProtectedRoute>} />
      <Route path="/admin/system-logs" element={<ProtectedRoute permKey="admin_system_logs"><AdminSystemLogsPage /></ProtectedRoute>} />
      <Route path="/admin/invoice-reports" element={<ProtectedRoute permKey="admin_invoice_reports"><AdminInvoiceReportsPage /></ProtectedRoute>} />
      <Route path="/admin/survey-reports" element={<ProtectedRoute permKey="admin_survey_reports"><AdminSurveyReportsPage /></ProtectedRoute>} />
      <Route path="/email-delivery" element={<ProtectedRoute permKey="my_invoices"><EmailDeliveryReportPage /></ProtectedRoute>} />
      <Route path="/admin/email-delivery" element={<ProtectedRoute permKey="admin_invoice_reports"><EmailDeliveryReportPage adminMode /></ProtectedRoute>} />
      <Route path="/admin/scheduler" element={<ProtectedRoute permKey="admin_system_logs"><AdminSchedulerReportPage /></ProtectedRoute>} />
      <Route path="/review-feedback" element={<ProtectedRoute permKey="review_feedback"><ReviewFeedbackPage /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
