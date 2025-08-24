import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import MemberForm from "@/components/forms/MemberForm";
import { type MemberWithSavings } from "@shared/schema";

export default function Members() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<MemberWithSavings | null>(null);
  const { toast } = useToast();

  const { data: members = [], isLoading } = useQuery<MemberWithSavings[]>({
    queryKey: ["/api/members"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/members/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({
        title: "Success",
        description: "Member deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete member",
        variant: "destructive",
      });
    },
  });

  const filteredMembers = members.filter(member =>
    `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.memberNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (member: MemberWithSavings) => {
    setEditingMember(member);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this member?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingMember(null);
  };

  if (isLoading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6" data-testid="members-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold leading-7 text-gray-900 sm:text-2xl lg:text-3xl sm:truncate" data-testid="members-title">
              Members Management
            </h2>
            <p className="mt-1 text-sm sm:text-base text-gray-500">
              Manage SACCO members and their information
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingMember(null)} className="mobile-button touch-friendly" data-testid="button-add-member">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Member
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md" data-testid="member-dialog">
                <DialogHeader>
                  <DialogTitle>
                    {editingMember ? "Edit Member" : "Add New Member"}
                  </DialogTitle>
                </DialogHeader>
                <MemberForm 
                  member={editingMember}
                  onSuccess={handleDialogClose}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search members..."
              className="pl-10 mobile-button"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-members"
            />
          </div>
        </div>

        {/* Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="members-grid">
          {filteredMembers.map((member) => (
            <Card key={member.id} className="hover:shadow-md transition-shadow" data-testid={`member-card-${member.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg" data-testid={`member-${member.id}-name`}>
                    {member.firstName} {member.lastName}
                  </CardTitle>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(member)}
                      className="touch-friendly p-2"
                      data-testid={`button-edit-member-${member.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(member.id)}
                      className="text-red-600 hover:text-red-700 touch-friendly p-2"
                      data-testid={`button-delete-member-${member.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-gray-500" data-testid={`member-${member.id}-number`}>
                  Member #{member.memberNumber}
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Email:</span>
                  <span className="text-sm font-medium" data-testid={`member-${member.id}-email`}>
                    {member.email || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Phone:</span>
                  <span className="text-sm font-medium" data-testid={`member-${member.id}-phone`}>
                    {member.phone}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Savings:</span>
                  <span className="text-sm font-medium text-green-600" data-testid={`member-${member.id}-savings`}>
                    UGX {parseInt(member.savingsBalance).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Joined:</span>
                  <span className="text-sm font-medium" data-testid={`member-${member.id}-joined`}>
                    {new Date(member.dateJoined).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Status:</span>
                  <span className={`text-sm font-medium ${member.isActive ? 'text-green-600' : 'text-red-600'}`} 
                        data-testid={`member-${member.id}-status`}>
                    {member.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredMembers.length === 0 && (
          <div className="text-center py-12" data-testid="no-members-found">
            <p className="text-gray-500 text-lg">
              {searchTerm ? "No members found matching your search." : "No members registered yet."}
            </p>
            {!searchTerm && (
              <Button
                className="mt-4"
                onClick={() => setDialogOpen(true)}
                data-testid="button-add-first-member"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Member
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
