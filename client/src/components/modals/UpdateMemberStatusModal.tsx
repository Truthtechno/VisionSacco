import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Member } from "@shared/schema";

interface UpdateMemberStatusModalProps {
  member: Member | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UpdateMemberStatusModal({ member, isOpen, onClose }: UpdateMemberStatusModalProps) {
  const [status, setStatus] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: async ({ memberId, status }: { memberId: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/members/${memberId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/unfreeze-requests"] });
      toast({
        title: "Status Updated",
        description: `Member status has been updated to ${status}.`,
      });
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update member status",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!member || !status) return;
    updateStatusMutation.mutate({ memberId: member.id, status });
  };

  const handleClose = () => {
    setStatus("");
    onClose();
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case "active":
        return "Member can access all services normally";
      case "inactive":
        return "Member is temporarily inactive but can be reactivated";
      case "frozen":
        return "Member account is frozen - member cannot access services but can request reactivation";
      default:
        return "";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-600";
      case "inactive":
        return "text-yellow-600";
      case "frozen":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Member Status</DialogTitle>
          <DialogDescription>
            Change the status for {member?.firstName} {member?.lastName} ({member?.memberNumber}).
            Current status: <span className={`font-medium ${getStatusColor(member?.status || "")}`}>
              {member?.status}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">New Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger data-testid="select-member-status">
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">
                  <div className="flex flex-col">
                    <span className="font-medium text-green-600">Active</span>
                    <span className="text-xs text-gray-500">Full access to all services</span>
                  </div>
                </SelectItem>
                <SelectItem value="inactive">
                  <div className="flex flex-col">
                    <span className="font-medium text-yellow-600">Inactive</span>
                    <span className="text-xs text-gray-500">Temporarily inactive</span>
                  </div>
                </SelectItem>
                <SelectItem value="frozen">
                  <div className="flex flex-col">
                    <span className="font-medium text-red-600">Frozen</span>
                    <span className="text-xs text-gray-500">Account frozen - can request reactivation</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {status && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Description:</strong> {getStatusDescription(status)}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            data-testid="button-cancel-status-update"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!status || updateStatusMutation.isPending}
            data-testid="button-update-status"
          >
            {updateStatusMutation.isPending ? "Updating..." : "Update Status"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}