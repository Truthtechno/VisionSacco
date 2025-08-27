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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import type { Member } from "@shared/schema";

interface RequestUnfreezeModalProps {
  member: Member | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RequestUnfreezeModal({ member, isOpen, onClose }: RequestUnfreezeModalProps) {
  const [reason, setReason] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const requestUnfreezeMutation = useMutation({
    mutationFn: async ({ memberId, reason }: { memberId: string; reason?: string }) => {
      const response = await apiRequest("POST", "/api/unfreeze-requests", { 
        memberId, 
        reason: reason?.trim() || null
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/unfreeze-requests"] });
      toast({
        title: "Request Submitted",
        description: "Your unfreeze request has been submitted to the administrators for review.",
      });
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit unfreeze request",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!member) return;
    requestUnfreezeMutation.mutate({ memberId: member.id, reason });
  };

  const handleClose = () => {
    setReason("");
    onClose();
  };

  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Account Unfreeze</DialogTitle>
          <DialogDescription>
            Your account is currently frozen. Submit a request to administrators for account reactivation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <div className="w-5 h-5 rounded-full bg-red-500 flex-shrink-0 mt-0.5"></div>
              <div>
                <h4 className="font-medium text-red-800">Account Frozen</h4>
                <p className="text-sm text-red-700 mt-1">
                  Your account has been frozen by an administrator. While frozen, you cannot access SACCO services 
                  such as loans, savings transactions, or other member benefits.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Reason for Unfreeze Request <span className="text-gray-500">(optional)</span>
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why you are requesting to unfreeze your account..."
              rows={4}
              data-testid="textarea-unfreeze-reason"
            />
            <p className="text-xs text-gray-500 mt-1">
              Providing a reason can help administrators process your request faster.
            </p>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>What happens next:</strong> Your request will be reviewed by administrators. 
              You will be notified once a decision has been made. This process typically takes 1-3 business days.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            data-testid="button-cancel-unfreeze-request"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={requestUnfreezeMutation.isPending}
            data-testid="button-submit-unfreeze-request"
          >
            {requestUnfreezeMutation.isPending ? "Submitting..." : "Submit Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}