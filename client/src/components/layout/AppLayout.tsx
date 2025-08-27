import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Users, 
  DollarSign, 
  FileText, 
  Settings, 
  LogOut, 
  User,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Role-based navigation
  const getNavigation = () => {
    if (user?.role === "admin") {
      return [
        { name: "Admin Panel", href: "/admin-panel", icon: Home },
        { name: "Members", href: "/members", icon: Users },
        { name: "Loans", href: "/loans", icon: DollarSign },
        { name: "Reports", href: "/reports", icon: FileText },
        { name: "Settings", href: "/admin", icon: Settings },
      ];
    } else if (user?.role === "manager") {
      return [
        { name: "Manager Dashboard", href: "/manager", icon: Home },
        { name: "Members", href: "/members", icon: Users },
        { name: "Loans", href: "/loans", icon: DollarSign },
        { name: "Reports", href: "/reports", icon: FileText },
      ];
    } else {
      return [
        { name: "My Portal", href: "/member-portal", icon: Home },
        { name: "My Loans", href: "/member-portal", icon: DollarSign },
        { name: "My Profile", href: "/member-portal", icon: User },
      ];
    }
  };

  const navigation = getNavigation();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-emerald-600">
                  Vision for Africa SACCO
                </h1>
              </div>
              <nav className="hidden md:ml-8 md:flex md:space-x-8">
                {navigation.map((item) => {
                  const isActive = location === item.href || (item.href === "/dashboard" && location === "/");
                  return (
                    <Link key={item.name} href={item.href}>
                      <a
                        className={cn(
                          "inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors",
                          isActive
                            ? "border-b-2 border-emerald-500 text-emerald-600"
                            : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        )}
                        data-testid={`nav-${item.name.toLowerCase()}`}
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.name}
                      </a>
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="hidden md:flex md:items-center md:space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                <User className="h-4 w-4" />
                <span>{user?.name}</span>
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded">
                  {user?.role}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                data-testid="button-mobile-menu"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              {navigation.map((item) => {
                const isActive = location === item.href || (item.href === "/dashboard" && location === "/");
                return (
                  <Link key={item.name} href={item.href}>
                    <a
                      className={cn(
                        "flex items-center px-3 py-2 text-base font-medium rounded-md transition-colors",
                        isActive
                          ? "bg-emerald-50 text-emerald-600"
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                      data-testid={`mobile-nav-${item.name.toLowerCase()}`}
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </a>
                  </Link>
                );
              })}
              <div className="px-3 py-2 border-t border-gray-200 mt-2">
                <div className="flex items-center space-x-2 text-sm text-gray-700 mb-2">
                  <User className="h-4 w-4" />
                  <span>{user?.name}</span>
                  <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded">
                    {user?.role}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full"
                  data-testid="mobile-button-logout"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}