import { useLocation } from "wouter";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Banknote,
  BarChart3,
  Settings,
  Building2,
  User,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, testId: "nav-dashboard" },
  { name: "Members", href: "/members", icon: Users, testId: "nav-members" },
  { name: "Loans", href: "/loans", icon: Banknote, testId: "nav-loans" },
  { name: "Reports", href: "/reports", icon: BarChart3, testId: "nav-reports" },
  { name: "Admin", href: "/admin", icon: Settings, testId: "nav-admin" },
];

export default function Sidebar() {
  const [location] = useLocation();

  const isActive = (href: string) => {
    if (href === "/") {
      return location === "/" || location === "/dashboard";
    }
    return location === href;
  };

  return (
    <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex items-center flex-shrink-0 px-4" data-testid="logo-section">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Vision SACCO</h1>
            <p className="text-xs text-gray-500">Financial Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex-1 flex flex-col">
        <nav className="flex-1 px-2 space-y-1" data-testid="navigation-menu">
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.name} href={item.href}>
                <a
                  className={cn(
                    active
                      ? "bg-primary-50 border-r-2 border-primary-600 text-primary-700"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-l-md"
                  )}
                  data-testid={item.testId}
                >
                  <item.icon
                    className={cn(
                      active
                        ? "text-primary-600"
                        : "text-gray-400 group-hover:text-gray-500",
                      "mr-3 flex-shrink-0 h-5 w-5"
                    )}
                  />
                  {item.name}
                </a>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Profile */}
      <div className="flex-shrink-0 flex border-t border-gray-200 p-4" data-testid="user-profile">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
              <User className="h-4 w-4 text-gray-600" />
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">John Doe</p>
            <p className="text-xs text-gray-500">Administrator</p>
          </div>
        </div>
      </div>
    </div>
  );
}
