import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  trend?: {
    value: string;
    label: string;
    positive?: boolean;
  };
  testId?: string;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  iconColor,
  iconBgColor,
  trend,
  testId,
}: StatCardProps) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg" data-testid={testId}>
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={cn("w-8 h-8 rounded-md flex items-center justify-center", iconBgColor)}>
              <Icon className={cn("h-5 w-5", iconColor)} />
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate" data-testid={`${testId}-title`}>
                {title}
              </dt>
              <dd className="text-lg font-medium text-gray-900" data-testid={`${testId}-value`}>
                {value}
              </dd>
            </dl>
          </div>
        </div>
      </div>
      {trend && (
        <div className="bg-gray-50 px-5 py-3" data-testid={`${testId}-trend`}>
          <div className="text-sm">
            <span
              className={cn(
                "font-medium",
                trend.positive !== false ? "text-green-600" : "text-red-600"
              )}
            >
              {trend.value}
            </span>
            <span className="text-gray-500 ml-1">{trend.label}</span>
          </div>
        </div>
      )}
    </div>
  );
}
