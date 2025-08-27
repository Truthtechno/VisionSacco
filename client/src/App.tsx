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

  // Role-based routing with redirects
  return (
    <AppLayout>
      <Switch>
        <Route path="/auth" component={() => {
          // Redirect authenticated users based on their role
          if (user.role === "admin") {
            window.location.href = "/admin-panel";
          } else if (user.role === "manager") {
            window.location.href = "/manager";
          } else {
            window.location.href = "/member-portal";
          }
          return null;
        }} />
        
        {/* Admin routes */}
        {user.role === "admin" && (
          <>
            <Route path="/" component={() => {
              window.location.href = "/admin-panel";
              return null;
            }} />
            <Route path="/admin-panel" component={AdminPanel} />
            <Route path="/admin" component={Admin} />
            <Route path="/members" component={Members} />
            <Route path="/loans" component={Loans} />
            <Route path="/reports" component={Reports} />
          </>
        )}
        
        {/* Manager routes */}
        {user.role === "manager" && (
          <>
            <Route path="/" component={() => {
              window.location.href = "/manager";
              return null;
            }} />
            <Route path="/manager" component={ManagerDashboard} />
            <Route path="/members" component={Members} />
            <Route path="/loans" component={Loans} />
            <Route path="/reports" component={Reports} />
          </>
        )}
        
        {/* Member routes */}
        {user.role === "member" && (
          <>
            <Route path="/" component={() => {
              window.location.href = "/member-portal";
              return null;
            }} />
            <Route path="/member-portal" component={MemberPortal} />
          </>
        )}
        
        {/* Fallback for unauthorized access */}
        <Route component={() => (
          <div className="flex flex-col items-center justify-center min-h-96">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        )} />
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
