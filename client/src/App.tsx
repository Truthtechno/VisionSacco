import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Members from "@/pages/Members";
import Loans from "@/pages/Loans";
import Reports from "@/pages/Reports";
import Admin from "@/pages/Admin";
import MemberPortal from "@/pages/MemberPortal";
import ManagerDashboard from "@/pages/ManagerDashboard";
import AdminPanel from "@/pages/AdminPanel";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";
import { queryClient } from "./lib/queryClient";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-emerald-700">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <Route>
          <AuthPage />
        </Route>
      </Switch>
    );
  }

  return (
    <AppLayout>
      <Switch>
        <Route path="/auth" component={() => {
          window.location.href = "/";
          return null;
        }} />
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/members" component={Members} />
        <Route path="/loans" component={Loans} />
        <Route path="/reports" component={Reports} />
        <Route path="/admin" component={Admin} />
        <Route path="/member-portal" component={MemberPortal} />
        <Route path="/manager" component={ManagerDashboard} />
        <Route path="/admin-panel" component={AdminPanel} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AuthProvider>
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
