import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Settings, Users, Shield, Database, AlertTriangle, CheckCircle, Info, TestTube } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type DashboardStats, type MemberWithSavings, type TransactionWithDetails } from "@shared/schema";

export default function Admin() {
  const [systemSettings, setSystemSettings] = useState({
    allowNewMembers: true,
    requireApproval: false,
    maintenanceMode: false,
    backupEnabled: true,
    notificationsEnabled: true,
  });

  const { toast } = useToast();

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: members = [] } = useQuery<MemberWithSavings[]>({
    queryKey: ["/api/members"],
  });

  const { data: transactions = [] } = useQuery<TransactionWithDetails[]>({
    queryKey: ["/api/transactions"],
  });

  // Load demo data mutation
  const loadDemoDataMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/admin/load-demo-data");
    },
    onSuccess: () => {
      // Invalidate all queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repayments"] });
      
      toast({
        title: "Demo Data Loaded",
        description: "Sample data has been successfully loaded into the system.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to load demo data. Please try again.",
        variant: "destructive",
      });
    },
  });

  const systemAlerts = [
    {
      id: 1,
      type: "warning",
      title: "5 loan payments overdue",
      description: "Requires follow-up action",
      icon: AlertTriangle,
      color: "text-yellow-500",
    },
    {
      id: 2,
      type: "info",
      title: "Monthly backup completed",
      description: "Data secure and up to date",
      icon: Info,
      color: "text-blue-500",
    },
    {
      id: 3,
      type: "success",
      title: "All systems operational",
      description: "No issues detected",
      icon: CheckCircle,
      color: "text-green-500",
    },
  ];

  const systemStats = [
    {
      title: "System Uptime",
      value: "99.9%",
      description: "Last 30 days",
      testId: "stat-uptime",
    },
    {
      title: "Database Size",
      value: "2.4 GB",
      description: "Total storage used",
      testId: "stat-database-size",
    },
    {
      title: "Active Sessions",
      value: "12",
      description: "Current users online",
      testId: "stat-active-sessions",
    },
    {
      title: "Last Backup",
      value: "2 hours ago",
      description: "Automated backup",
      testId: "stat-last-backup",
    },
  ];

  const handleSettingChange = (setting: string, value: boolean) => {
    setSystemSettings(prev => ({
      ...prev,
      [setting]: value,
    }));
  };

  const isDevelopment = import.meta.env.MODE === 'development' || import.meta.env.DEV;
  const currentRole = "admin"; // In a real app, this would come from user context

  return (
    <div className="py-6" data-testid="admin-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl" data-testid="admin-title">
            System Administration
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage system settings, users, and monitor SACCO operations
          </p>
        </div>

        {/* System Overview */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8" data-testid="system-overview">
          {systemStats.map((stat) => (
            <Card key={stat.title} data-testid={stat.testId}>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <p className="text-xs text-gray-400">{stat.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="settings" className="space-y-6" data-testid="admin-tabs">
          <TabsList>
            <TabsTrigger value="settings" data-testid="tab-settings">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">
              <Users className="w-4 h-4 mr-2" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="security" data-testid="tab-security">
              <Shield className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="system" data-testid="tab-system">
              <Database className="w-4 h-4 mr-2" />
              System
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-6" data-testid="settings-tab-content">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* General Settings */}
              <Card data-testid="general-settings">
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="allow-new-members">Allow New Member Registration</Label>
                      <p className="text-sm text-gray-500">
                        Enable new members to register in the SACCO
                      </p>
                    </div>
                    <Switch
                      id="allow-new-members"
                      checked={systemSettings.allowNewMembers}
                      onCheckedChange={(checked) => handleSettingChange('allowNewMembers', checked)}
                      data-testid="switch-allow-new-members"
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="require-approval">Require Admin Approval</Label>
                      <p className="text-sm text-gray-500">
                        New members require admin approval before activation
                      </p>
                    </div>
                    <Switch
                      id="require-approval"
                      checked={systemSettings.requireApproval}
                      onCheckedChange={(checked) => handleSettingChange('requireApproval', checked)}
                      data-testid="switch-require-approval"
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notifications">Enable Notifications</Label>
                      <p className="text-sm text-gray-500">
                        Send email notifications for important events
                      </p>
                    </div>
                    <Switch
                      id="notifications"
                      checked={systemSettings.notificationsEnabled}
                      onCheckedChange={(checked) => handleSettingChange('notificationsEnabled', checked)}
                      data-testid="switch-notifications"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* System Maintenance */}
              <Card data-testid="system-maintenance">
                <CardHeader>
                  <CardTitle>System Maintenance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                      <p className="text-sm text-gray-500">
                        Temporarily disable access for system updates
                      </p>
                    </div>
                    <Switch
                      id="maintenance-mode"
                      checked={systemSettings.maintenanceMode}
                      onCheckedChange={(checked) => handleSettingChange('maintenanceMode', checked)}
                      data-testid="switch-maintenance-mode"
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="backup-enabled">Automatic Backups</Label>
                      <p className="text-sm text-gray-500">
                        Enable daily automated data backups
                      </p>
                    </div>
                    <Switch
                      id="backup-enabled"
                      checked={systemSettings.backupEnabled}
                      onCheckedChange={(checked) => handleSettingChange('backupEnabled', checked)}
                      data-testid="switch-backup-enabled"
                    />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Button className="w-full" data-testid="button-manual-backup">
                      Run Manual Backup
                    </Button>
                    <Button variant="outline" className="w-full" data-testid="button-system-health">
                      Check System Health
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6" data-testid="users-tab-content">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Statistics */}
              <Card data-testid="user-statistics">
                <CardHeader>
                  <CardTitle>User Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total Members</span>
                    <Badge variant="secondary" data-testid="total-members-count">
                      {stats?.totalMembers || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Active This Month</span>
                    <Badge variant="secondary" data-testid="active-members-count">
                      {members.filter(m => m.isActive).length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>New This Month</span>
                    <Badge variant="secondary" data-testid="new-members-count">
                      +{stats?.memberGrowth || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Pending Approval</span>
                    <Badge variant="outline" data-testid="pending-approval-count">
                      0
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card data-testid="recent-user-activity">
                <CardHeader>
                  <CardTitle>Recent User Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {transactions.slice(0, 5).map((transaction) => (
                      <div key={transaction.id} className="flex items-center space-x-3" data-testid={`activity-${transaction.id}`}>
                        <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full"></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 truncate">
                            {transaction.memberName || 'System'} - {transaction.type.replace('_', ' ')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(transaction.transactionDate).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6" data-testid="security-tab-content">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Security Settings */}
              <Card data-testid="security-settings">
                <CardHeader>
                  <CardTitle>Security Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                    <Input
                      id="session-timeout"
                      type="number"
                      defaultValue="30"
                      data-testid="input-session-timeout"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
                    <Input
                      id="max-login-attempts"
                      type="number"
                      defaultValue="5"
                      data-testid="input-max-login-attempts"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-policy">Minimum Password Length</Label>
                    <Input
                      id="password-policy"
                      type="number"
                      defaultValue="8"
                      data-testid="input-password-length"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* System Alerts */}
              <Card data-testid="system-alerts">
                <CardHeader>
                  <CardTitle>System Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {systemAlerts.map((alert) => (
                      <div key={alert.id} className="flex items-start space-x-3" data-testid={`alert-${alert.id}`}>
                        <div className="flex-shrink-0">
                          <alert.icon className={`h-5 w-5 ${alert.color}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-900">{alert.title}</p>
                          <p className="text-xs text-gray-500">{alert.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-6" data-testid="system-tab-content">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* System Information */}
              <Card data-testid="system-information">
                <CardHeader>
                  <CardTitle>System Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Version</span>
                    <span className="text-sm font-medium">v1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Environment</span>
                    <Badge variant="outline">Production</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Server Time</span>
                    <span className="text-sm font-medium">{new Date().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Total Transactions</span>
                    <span className="text-sm font-medium">{transactions.length}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Database Management */}
              <Card data-testid="database-management">
                <CardHeader>
                  <CardTitle>Database Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Database Status</span>
                    <Badge className="bg-green-100 text-green-800">Connected</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Storage Used</span>
                    <span className="text-sm font-medium">2.4 GB / 10 GB</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '24%' }}></div>
                  </div>
                  <div className="pt-2 space-y-2">
                    <Button variant="outline" className="w-full" data-testid="button-optimize-database">
                      Optimize Database
                    </Button>
                    <Button variant="outline" className="w-full" data-testid="button-export-data">
                      Export Data
                    </Button>
                    {isDevelopment && currentRole === "admin" && (
                      <Button 
                        variant="outline" 
                        className="w-full bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100" 
                        onClick={() => loadDemoDataMutation.mutate()}
                        disabled={loadDemoDataMutation.isPending}
                        data-testid="button-load-demo-data"
                      >
                        <TestTube className="mr-2 h-4 w-4" />
                        {loadDemoDataMutation.isPending ? "Loading..." : "Load Demo Data"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
