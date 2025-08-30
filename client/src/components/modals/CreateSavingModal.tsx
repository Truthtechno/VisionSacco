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

type SavingFormData = z.infer<typeof insertDepositSchema>;

interface CreateSavingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedMemberId?: string;
}

export default function CreateSavingModal({ isOpen, onClose, preselectedMemberId }: CreateSavingModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<SavingFormData>({
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
    enabled: isOpen,
  });

  const createSavingMutation = useMutation({
    mutationFn: async (data: SavingFormData) => {
      const response = await apiRequest("POST", "/api/deposits", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Saving recorded successfully",
        description: "The saving has been recorded and is pending approval.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/deposits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      onClose();
      reset();
    },
    onError: (error: any) => {
      console.error("Saving creation error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to record saving. Please try again.",
      });
    },
  });

  const onSubmit = (data: SavingFormData) => {
    console.log("Form submitted with data:", data);
    console.log("Current user:", currentUser);
    
    // Validate required fields
    if (!data.memberId) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select a member.",
      });
      return;
    }
    
    if (!data.amount || Number(data.amount) <= 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter a valid amount.",
      });
      return;
    }
    
    if (!data.depositMethod) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select a payment method.",
      });
      return;
    }
    
    if (!currentUser?.data?.id) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "User session not found. Please log in again.",
      });
      return;
    }

    setIsSubmitting(true);
    // Generate saving number automatically
    const depositNumber = `S${String(Date.now()).slice(-6)}`;
    const savingData = {
      memberId: data.memberId,
      amount: String(data.amount),
      depositMethod: data.depositMethod,
      status: "pending" as const,
      notes: data.notes || "",
      depositNumber,
      recordedBy: currentUser.data.id,
    };
    
    console.log("Submitting saving data:", savingData);
    createSavingMutation.mutate(savingData, {
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
          <DialogTitle>Record Member Saving</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="memberId">Member</Label>
            <Select 
              onValueChange={(value) => setValue("memberId", value, { shouldValidate: true })}
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
            <input type="hidden" {...register("memberId", { required: "Please select a member" })} />
            {errors.memberId && (
              <p className="text-sm text-red-600">{errors.memberId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Saving Amount (UGX)</Label>
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
            <Label htmlFor="depositMethod">Payment Method</Label>
            <Select onValueChange={(value) => setValue("depositMethod", value, { shouldValidate: true })}>
              <SelectTrigger data-testid="select-payment-method">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="mobile_money">Mobile Money</SelectItem>
              </SelectContent>
            </Select>
            <input type="hidden" {...register("depositMethod", { required: "Please select a payment method" })} />
            {errors.depositMethod && (
              <p className="text-sm text-red-600">{errors.depositMethod.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional notes about this saving..."
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
              disabled={isSubmitting || createSavingMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
              data-testid="button-record-saving"
            >
              {isSubmitting || createSavingMutation.isPending ? "Recording..." : "Record Saving"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}