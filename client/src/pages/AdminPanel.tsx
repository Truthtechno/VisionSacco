import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Users, CreditCard, Shield, Plus, Edit2, Trash2, FileText } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { MemberWithSavings, DashboardStats, RepaymentWithDetails } from "@shared/schema";

export default function AdminPanel() {
  const [showAddUser, setShowAddUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<MemberWithSavings | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "member",
    memberNumber: "",
    nationalId: "",
    address: "",
    isActive: true
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all members for user management
  const { data: members = [], isLoading: membersLoading } = useQuery<MemberWithSavings[]>({
    queryKey: ['/api/members'],
  });

  // Fetch dashboard stats for overview
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  // Fetch recent repayments
  const { data: repayments = [] } = useQuery<RepaymentWithDetails[]>({
    queryKey: ['/api/repayments'],
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof formData) => {
      return apiRequest('/api/members', 'POST', userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "User Created",
        description: "New user has been created successfully.",
      });
      setShowAddUser(false);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        role: "member",
        memberNumber: "",
        nationalId: "",
        address: "",
        isActive: true
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string, updates: Partial<typeof formData> }) => {
      return apiRequest(`/api/members/${id}`, 'PUT', updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/members'] });
      toast({
        title: "User Updated",
        description: "User information has been updated successfully.",
      });
      setSelectedUser(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user. Please try again.",
        variant: "destructive",
      });
    }
  });

  const formatCurrency = (amount: string | number) => {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `UGX ${value.toLocaleString()}`;
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString();
  };

  const getRoleBadge = (role: string) => {
    const roleColors = {
      admin: "bg-red-100 text-red-800",
      manager: "bg-blue-100 text-blue-800",
      member: "bg-green-100 text-green-800"
    };
    
    return (
      <Badge className={roleColors[role as keyof typeof roleColors] || "bg-gray-100 text-gray-800"}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  const handleCreateUser = () => {
    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.memberNumber) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    createUserMutation.mutate(formData);
  };

  const generateMemberNumber = () => {
    const prefix = "VFA";
    const nextNumber = String(members.length + 1).padStart(3, '0');
    return `${prefix}${nextNumber}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
          System Administration
        </h1>
        <Button onClick={() => {
          setFormData(prev => ({ ...prev, memberNumber: generateMemberNumber() }));
          setShowAddUser(true);
        }} data-testid="button-add-user">
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card data-testid="card-total-users">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-users">
              {members.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Active system users
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-active-members">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-members">
              {members.filter(m => m.isActive && m.role === 'member').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-savings">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
            <CreditCard className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-savings">
              {stats?.totalSavings || "UGX 0"}
            </div>
            <p className="text-xs text-muted-foreground">
              Member deposits
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-system-health">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-system-status">
              Healthy
            </div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Admin Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList data-testid="tabs-list">
          <TabsTrigger value="users" data-testid="tab-users">User Management</TabsTrigger>
          <TabsTrigger value="repayments" data-testid="tab-repayments">Repayments</TabsTrigger>
          <TabsTrigger value="system" data-testid="tab-system">System Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card data-testid="card-user-management">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              {membersLoading ? (
                <div className="text-center py-8" data-testid="loading-users">
                  Loading users...
                </div>
              ) : (
                <div className="space-y-4">
                  {members.map((member) => (
                    <div key={member.id} className="border rounded-lg p-4" data-testid={`user-item-${member.id}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold" data-testid={`text-user-name-${member.id}`}>
                              {member.firstName} {member.lastName}
                            </h3>
                            {getRoleBadge(member.role || 'member')}
                            {!member.isActive && (
                              <Badge variant="outline" className="bg-gray-100 text-gray-600">
                                Inactive
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600" data-testid={`text-user-member-number-${member.id}`}>
                            Member #: {member.memberNumber}
                          </p>
                          <p className="text-sm text-gray-600">
                            Email: {member.email || "Not provided"}
                          </p>
                          <p className="text-sm text-gray-600">
                            Phone: {member.phone}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setSelectedUser(member)}
                            data-testid={`button-edit-user-${member.id}`}
                          >
                            <Edit2 className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700"
                            onClick={() => updateUserMutation.mutate({ 
                              id: member.id, 
                              updates: { isActive: !member.isActive } 
                            })}
                            data-testid={`button-toggle-user-${member.id}`}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            {member.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Joined:</span>
                          <p className="font-medium">{formatDate(member.dateJoined)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Savings Balance:</span>
                          <p className="font-medium" data-testid={`text-user-savings-${member.id}`}>
                            {formatCurrency(member.savingsBalance)}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Location:</span>
                          <p className="font-medium">{member.address || "Not provided"}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">National ID:</span>
                          <p className="font-medium">{member.nationalId || "Not provided"}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="repayments" className="space-y-4">
          <Card data-testid="card-repayments">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Recent Loan Repayments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {repayments.length === 0 ? (
                <div className="text-center py-8 text-gray-500" data-testid="no-repayments">
                  <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  No repayments recorded yet
                </div>
              ) : (
                <div className="space-y-3">
                  {repayments.slice(0, 10).map((repayment) => (
                    <div key={repayment.id} className="flex justify-between items-center border-b pb-3" data-testid={`repayment-item-${repayment.id}`}>
                      <div>
                        <p className="font-medium" data-testid={`text-repayment-loan-${repayment.id}`}>
                          {repayment.loanNumber} - {repayment.memberName}
                        </p>
                        <p className="text-sm text-gray-600">
                          Processed by: {repayment.processorName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(repayment.paymentDate)} • {repayment.paymentMethod.replace('_', ' ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600" data-testid={`text-repayment-amount-${repayment.id}`}>
                          {formatCurrency(repayment.amount)}
                        </p>
                        <p className="text-sm text-gray-500 capitalize">
                          {repayment.paymentMethod.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card data-testid="card-system-settings">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Interest Rate Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="default-interest">Default Interest Rate (%)</Label>
                      <Input id="default-interest" type="number" placeholder="15" defaultValue="15" />
                    </div>
                    <div>
                      <Label htmlFor="max-loan-amount">Maximum Loan Amount (UGX)</Label>
                      <Input id="max-loan-amount" type="number" placeholder="10000000" defaultValue="10000000" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Loan Approval Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="auto-approve-limit">Auto-Approve Limit (UGX)</Label>
                      <Input id="auto-approve-limit" type="number" placeholder="500000" defaultValue="500000" />
                    </div>
                    <div>
                      <Label htmlFor="max-term">Maximum Loan Term (months)</Label>
                      <Input id="max-term" type="number" placeholder="24" defaultValue="24" />
                    </div>
                  </div>
                </div>

                <Button className="w-full md:w-auto" data-testid="button-save-settings">
                  Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit User Modal */}
      <Dialog open={showAddUser || !!selectedUser} onOpenChange={(open) => {
        if (!open) {
          setShowAddUser(false);
          setSelectedUser(null);
        }
      }}>
        <DialogContent className="max-w-md" data-testid="dialog-user-form">
          <DialogHeader>
            <DialogTitle>{selectedUser ? 'Edit User' : 'Add New User'}</DialogTitle>
            <DialogDescription>
              {selectedUser ? 'Update user information and permissions.' : 'Create a new user account with specific role and permissions.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first-name">First Name *</Label>
                <Input 
                  id="first-name" 
                  placeholder="John" 
                  value={selectedUser ? selectedUser.firstName : formData.firstName}
                  onChange={(e) => selectedUser ? 
                    setSelectedUser({...selectedUser, firstName: e.target.value}) :
                    setFormData(prev => ({ ...prev, firstName: e.target.value }))
                  }
                  data-testid="input-first-name" 
                />
              </div>
              <div>
                <Label htmlFor="last-name">Last Name *</Label>
                <Input 
                  id="last-name" 
                  placeholder="Doe" 
                  value={selectedUser ? selectedUser.lastName : formData.lastName}
                  onChange={(e) => selectedUser ?
                    setSelectedUser({...selectedUser, lastName: e.target.value}) :
                    setFormData(prev => ({ ...prev, lastName: e.target.value }))
                  }
                  data-testid="input-last-name" 
                />
              </div>
            </div>
            <div>
              <Label htmlFor="member-number">Member Number *</Label>
              <Input 
                id="member-number" 
                placeholder="VFA001" 
                value={selectedUser ? selectedUser.memberNumber : formData.memberNumber}
                onChange={(e) => selectedUser ?
                  setSelectedUser({...selectedUser, memberNumber: e.target.value}) :
                  setFormData(prev => ({ ...prev, memberNumber: e.target.value }))
                }
                data-testid="input-member-number" 
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="john.doe@example.com" 
                value={selectedUser ? (selectedUser.email || '') : formData.email}
                onChange={(e) => selectedUser ?
                  setSelectedUser({...selectedUser, email: e.target.value}) :
                  setFormData(prev => ({ ...prev, email: e.target.value }))
                }
                data-testid="input-email" 
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input 
                id="phone" 
                placeholder="+256700000000" 
                value={selectedUser ? selectedUser.phone : formData.phone}
                onChange={(e) => selectedUser ?
                  setSelectedUser({...selectedUser, phone: e.target.value}) :
                  setFormData(prev => ({ ...prev, phone: e.target.value }))
                }
                data-testid="input-phone" 
              />
            </div>
            <div>
              <Label htmlFor="role">User Role</Label>
              <Select 
                value={selectedUser ? selectedUser.role || 'member' : formData.role}
                onValueChange={(value) => selectedUser ?
                  setSelectedUser({...selectedUser, role: value}) :
                  setFormData(prev => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger data-testid="select-role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAddUser(false);
                  setSelectedUser(null);
                }} 
                data-testid="button-cancel-user-form"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (selectedUser) {
                    updateUserMutation.mutate({ 
                      id: selectedUser.id, 
                      updates: {
                        firstName: selectedUser.firstName,
                        lastName: selectedUser.lastName,
                        email: selectedUser.email,
                        phone: selectedUser.phone,
                        role: selectedUser.role,
                        memberNumber: selectedUser.memberNumber
                      }
                    });
                  } else {
                    handleCreateUser();
                  }
                }}
                disabled={createUserMutation.isPending || updateUserMutation.isPending}
                data-testid="button-submit-user-form"
              >
                {selectedUser ? 
                  (updateUserMutation.isPending ? 'Updating...' : 'Update User') :
                  (createUserMutation.isPending ? 'Creating...' : 'Create User')
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}