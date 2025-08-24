import { useState } from "react";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Users,
  Banknote,
  BarChart3,
  Settings,
  Building2,
  User,
  Shield,
  UserCheck,
  CreditCard,
} from "lucide-react";

const roleNavigation = {
  member: [
    { name: "Member Portal", href: "/member-portal", icon: User, testId: "nav-member-portal" },
  ],
  manager: [
    { name: "Manager Dashboard", href: "/manager", icon: UserCheck, testId: "nav-manager-dashboard" },
    { name: "Dashboard", href: "/", icon: LayoutDashboard, testId: "nav-dashboard" },
    { name: "Members", href: "/members", icon: Users, testId: "nav-members" },
    { name: "Loans", href: "/loans", icon: Banknote, testId: "nav-loans" },
    { name: "Reports", href: "/reports", icon: BarChart3, testId: "nav-reports" },
  ],
  admin: [
    { name: "Admin Panel", href: "/admin-panel", icon: Shield, testId: "nav-admin-panel" },
    { name: "Dashboard", href: "/", icon: LayoutDashboard, testId: "nav-dashboard" },
    { name: "Manager Dashboard", href: "/manager", icon: UserCheck, testId: "nav-manager-dashboard" },
    { name: "Member Portal", href: "/member-portal", icon: User, testId: "nav-member-portal" },
    { name: "Members", href: "/members", icon: Users, testId: "nav-members" },
    { name: "Loans", href: "/loans", icon: Banknote, testId: "nav-loans" },
    { name: "Reports", href: "/reports", icon: BarChart3, testId: "nav-reports" },
    { name: "Admin", href: "/admin", icon: Settings, testId: "nav-admin" },
  ],
};

export default function Sidebar() {
  const [location] = useLocation();
  const [currentRole, setCurrentRole] = useState<keyof typeof roleNavigation>("admin");

  const isActive = (href: string) => {
    if (href === "/") {
      return location === "/" || location === "/dashboard";
    }
    return location === href;
  };

  const navigation = roleNavigation[currentRole];

  const getRoleBadge = (role: string) => {
    const roleColors = {
      admin: "bg-accent-50 text-accent-700 border border-accent-200",
      manager: "bg-primary-50 text-primary-700 border border-primary-200",
      member: "bg-green-50 text-green-700 border border-green-200"
    };
    
    return (
      <Badge className={roleColors[role as keyof typeof roleColors]}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-white border-r border-gray-200 shadow-sm">
      {/* Logo */}
      <div className="flex items-center flex-shrink-0 px-4" data-testid="logo-section">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Vision for Africa</h1>
            <p className="text-xs text-gray-500 font-medium">SACCO</p>
          </div>
        </div>
      </div>

      {/* Role Selector */}
      <div className="mt-6 px-4" data-testid="role-selector">
        <div className="mb-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Current Role</span>
        </div>
        <Select value={currentRole} onValueChange={(value) => setCurrentRole(value as keyof typeof roleNavigation)}>
          <SelectTrigger className="w-full" data-testid="select-role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="member">Member Access</SelectItem>
            <SelectItem value="manager">Manager Access</SelectItem>
            <SelectItem value="admin">Admin Access</SelectItem>
          </SelectContent>
        </Select>
        <div className="mt-2 flex justify-center">
          {getRoleBadge(currentRole)}
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-6 flex-1 flex flex-col">
        <nav className="flex-1 px-2 space-y-1" data-testid="navigation-menu">
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    active
                      ? "bg-primary-50 border-r-2 border-primary-600 text-primary-700"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
                    "group flex items-center px-3 py-3 text-sm font-medium rounded-l-md cursor-pointer transition-all duration-200 touch-friendly"
                  )}
                  data-testid={item.testId}
                >
                  <item.icon
                    className={cn(
                      active
                        ? "text-primary-600"
                        : "text-gray-400 group-hover:text-gray-500",
                      "mr-3 flex-shrink-0 h-5 w-5 transition-colors duration-200"
                    )}
                  />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Profile */}
      <div className="flex-shrink-0 flex border-t border-gray-200 p-4 bg-gray-50" data-testid="user-profile">
        <div className="flex items-center w-full">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-sm">
              <User className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-semibold text-gray-700">John Doe</p>
            <p className="text-xs text-gray-500">Administrator</p>
          </div>
        </div>
      </div>
    </div>
  );
}
