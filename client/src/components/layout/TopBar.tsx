import { Bell, HelpCircle, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  onMenuClick: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-white border-b border-gray-200">
      <Button
        variant="ghost"
        size="sm"
        className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden"
        onClick={onMenuClick}
        data-testid="button-mobile-menu"
      >
        <Menu className="h-6 w-6" />
      </Button>

      <div className="flex-1 px-4 flex justify-between items-center">
        <div className="flex-1 flex">
          <h1 className="text-2xl font-semibold text-gray-900" data-testid="page-title">
            Vision for Africa SACCO
          </h1>
        </div>

        <div className="ml-4 flex items-center md:ml-6 space-x-4" data-testid="top-bar-actions">
          <Button
            variant="ghost"
            size="sm"
            className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            data-testid="button-notifications"
          >
            <Bell className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            data-testid="button-help"
          >
            <HelpCircle className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
