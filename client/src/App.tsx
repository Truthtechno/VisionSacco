import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Members from "@/pages/Members";
import Loans from "@/pages/Loans";
import Reports from "@/pages/Reports";
import Admin from "@/pages/Admin";
import MemberPortal from "@/pages/MemberPortal";
import ManagerDashboard from "@/pages/ManagerDashboard";
import AdminPanel from "@/pages/AdminPanel";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <AppLayout>
      <Switch>
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
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
