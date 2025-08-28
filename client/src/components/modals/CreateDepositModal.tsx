import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { insertDepositSchema } from "@shared/schema";
import { z } from "zod";

type DepositFormData = z.infer<typeof insertDepositSchema>;

interface CreateDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedMemberId?: string;
}

export default function CreateDepositModal({ isOpen, onClose, preselectedMemberId }: CreateDepositModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<DepositFormData>({
    resolver: zodResolver(insertDepositSchema),
    defaultValues: {
      status: "pending",
    },
  });

  const { data: members = [] } = useQuery({
    queryKey: ["/api/members"],
    enabled: isOpen,
  });

  // Get current user for recording purposes
  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/auth/me");
      return response.json();
    },
  });

  const createDepositMutation = useMutation({
    mutationFn: (data: DepositFormData) =>
      apiRequest("POST", "/api/deposits", data),
    onSuccess: () => {
      toast({
        title: "Deposit recorded successfully",
        description: "The deposit has been recorded and is pending approval.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/deposits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      onClose();
      reset();
    },
    onError: (error: any) => {
      console.error("Deposit creation error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.response?.data?.message || error.message || "Failed to record deposit. Please try again.",
      });
    },
  });

  const onSubmit = (data: DepositFormData) => {
    setIsSubmitting(true);
    // Generate deposit number automatically
    const depositNumber = `D${String(Date.now()).slice(-6)}`;
    const depositData = {
      ...data,
      depositNumber,
      recordedBy: currentUser?.data?.id, // Use current user ID
    };
    createDepositMutation.mutate(depositData, {
      onSettled: () => setIsSubmitting(false),
    });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Member Deposit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="memberId">Member</Label>
            <Select 
              onValueChange={(value) => setValue("memberId", value)}
              defaultValue={preselectedMemberId}
            >
              <SelectTrigger data-testid="select-member">
                <SelectValue placeholder="Select a member" />
              </SelectTrigger>
              <SelectContent>
                {(members as any[]).map((member: any) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.firstName} {member.lastName} ({member.memberNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.memberId && (
              <p className="text-sm text-red-600">{errors.memberId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Deposit Amount (UGX)</Label>
            <Input
              id="amount"
              type="number"
              step="1000"
              min="1000"
              placeholder="e.g., 100000"
              {...register("amount", { required: "Amount is required" })}
              data-testid="input-amount"
            />
            {errors.amount && (
              <p className="text-sm text-red-600">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="depositMethod">Deposit Method</Label>
            <Select onValueChange={(value) => setValue("depositMethod", value)}>
              <SelectTrigger data-testid="select-deposit-method">
                <SelectValue placeholder="Select deposit method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="mobile_money">Mobile Money</SelectItem>
              </SelectContent>
            </Select>
            {errors.depositMethod && (
              <p className="text-sm text-red-600">{errors.depositMethod.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes about this deposit..."
              rows={3}
              {...register("notes")}
              data-testid="textarea-notes"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting || createDepositMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
              data-testid="button-record-deposit"
            >
              {isSubmitting || createDepositMutation.isPending ? "Recording..." : "Record Deposit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}