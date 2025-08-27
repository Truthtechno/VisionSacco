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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import type { UnfreezeRequestWithDetails } from "@shared/schema";
import { format } from "date-fns";

interface ProcessUnfreezeRequestModalProps {
  request: UnfreezeRequestWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProcessUnfreezeRequestModal({ request, isOpen, onClose }: ProcessUnfreezeRequestModalProps) {
  const [status, setStatus] = useState<string>("");
  const [adminNotes, setAdminNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const processRequestMutation = useMutation({
    mutationFn: async ({ requestId, status, processedBy, adminNotes }: { 
      requestId: string; 
      status: string; 
      processedBy: string; 
      adminNotes?: string;
    }) => {
      const response = await apiRequest("PATCH", `/api/unfreeze-requests/${requestId}/process`, { 
        status, 
        processedBy, 
        adminNotes 
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/unfreeze-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({
        title: "Request Processed",
        description: `Unfreeze request has been ${status}.`,
      });
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process unfreeze request",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!request || !status || !user?.id) return;
    processRequestMutation.mutate({ 
      requestId: request.id, 
      status, 
      processedBy: user.id, 
      adminNotes: adminNotes.trim() || undefined 
    });
  };

  const handleClose = () => {
    setStatus("");
    setAdminNotes("");
    onClose();
  };

  if (!request) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Process Unfreeze Request</DialogTitle>
          <DialogDescription>
            Review and process the unfreeze request from {request.memberName} ({request.memberNumber})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Request Details */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-2">
            <div>
              <strong>Member:</strong> {request.memberName} ({request.memberNumber})
            </div>
            <div>
              <strong>Requested:</strong> {format(new Date(request.requestedAt), "PPP 'at' p")}
            </div>
            {request.reason && (
              <div>
                <strong>Reason:</strong>
                <p className="mt-1 text-sm text-gray-700 bg-white p-2 rounded border">
                  {request.reason}
                </p>
              </div>
            )}
          </div>

          {/* Decision */}
          <div>
            <label className="text-sm font-medium mb-2 block">Decision</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger data-testid="select-request-decision">
                <SelectValue placeholder="Select decision" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">
                  <div className="flex flex-col">
                    <span className="font-medium text-green-600">Approve</span>
                    <span className="text-xs text-gray-500">Unfreeze account and set to active</span>
                  </div>
                </SelectItem>
                <SelectItem value="denied">
                  <div className="flex flex-col">
                    <span className="font-medium text-red-600">Deny</span>
                    <span className="text-xs text-gray-500">Keep account frozen</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Admin Notes */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Admin Notes {status === "denied" && <span className="text-red-500">(recommended for denials)</span>}
            </label>
            <Textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add notes about your decision (optional)"
              rows={3}
              data-testid="textarea-admin-notes"
            />
          </div>

          {status && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>What will happen:</strong> {" "}
                {status === "approved" 
                  ? "The member's account will be unfrozen and set to active status. They will regain full access to SACCO services."
                  : "The request will be denied and the member's account will remain frozen. The member will be notified of the decision."
                }
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            data-testid="button-cancel-process"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!status || processRequestMutation.isPending}
            variant={status === "approved" ? "default" : "destructive"}
            data-testid="button-process-request"
          >
            {processRequestMutation.isPending ? "Processing..." : `${status === "approved" ? "Approve" : "Deny"} Request`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}