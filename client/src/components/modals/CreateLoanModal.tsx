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
import { insertLoanSchema } from "@shared/schema";
import { z } from "zod";

type LoanFormData = z.infer<typeof insertLoanSchema>;

interface CreateLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedMemberId?: string;
}

export default function CreateLoanModal({ isOpen, onClose, preselectedMemberId }: CreateLoanModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<LoanFormData>({
    resolver: zodResolver(insertLoanSchema),
    defaultValues: {
      status: "pending",
      interestRate: "15.00",
    },
  });

  const { data: members = [] } = useQuery({
    queryKey: ["/api/members"],
    enabled: isOpen,
  });

  const createLoanMutation = useMutation({
    mutationFn: (data: LoanFormData) =>
      apiRequest("POST", "/api/loans", data),
    onSuccess: () => {
      toast({
        title: "Loan application created successfully",
        description: "The loan application has been submitted for review.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      onClose();
      reset();
    },
    onError: (error: any) => {
      console.error("Loan creation error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.response?.data?.message || error.message || "Failed to create loan application. Please try again.",
      });
    },
  });

  const onSubmit = (data: LoanFormData) => {
    setIsSubmitting(true);
    // Generate loan number automatically
    const loanNumber = `LN${String(Date.now()).slice(-6)}`;
    const loanData = {
      ...data,
      loanNumber,
      principal: data.principal,
      balance: data.principal, // Initial balance equals principal
    };
    createLoanMutation.mutate(loanData, {
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
          <DialogTitle>Create Loan Application</DialogTitle>
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
                {members.map((member: any) => (
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
            <Label htmlFor="principal">Loan Amount (UGX)</Label>
            <Input
              id="principal"
              type="number"
              step="10000"
              placeholder="Enter loan amount"
              data-testid="input-amount"
              {...register("principal")}
            />
            {errors.principal && (
              <p className="text-sm text-red-600">{errors.principal.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="termMonths">Term (Months)</Label>
            <Select onValueChange={(value) => setValue("termMonths", parseInt(value))}>
              <SelectTrigger data-testid="select-term">
                <SelectValue placeholder="Select loan term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6 months</SelectItem>
                <SelectItem value="12">12 months</SelectItem>
                <SelectItem value="18">18 months</SelectItem>
                <SelectItem value="24">24 months</SelectItem>
                <SelectItem value="36">36 months</SelectItem>
              </SelectContent>
            </Select>
            {errors.termMonths && (
              <p className="text-sm text-red-600">{errors.termMonths.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="interestRate">Interest Rate (%)</Label>
            <Input
              id="interestRate"
              type="number"
              step="0.1"
              placeholder="Enter interest rate"
              data-testid="input-interest-rate"
              {...register("interestRate")}
            />
            {errors.interestRate && (
              <p className="text-sm text-red-600">{errors.interestRate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="intendedPurpose">Purpose</Label>
            <Select onValueChange={(value) => setValue("intendedPurpose", value)}>
              <SelectTrigger data-testid="select-purpose">
                <SelectValue placeholder="Select loan purpose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="business_expansion">Business Expansion</SelectItem>
                <SelectItem value="equipment_purchase">Equipment Purchase</SelectItem>
                <SelectItem value="education_fees">Education Fees</SelectItem>
                <SelectItem value="medical_expenses">Medical Expenses</SelectItem>
                <SelectItem value="agriculture">Agriculture</SelectItem>
                <SelectItem value="housing">Housing</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.intendedPurpose && (
              <p className="text-sm text-red-600">{errors.intendedPurpose.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-2">
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
              disabled={isSubmitting}
              data-testid="button-submit-loan"
            >
              {isSubmitting ? "Creating..." : "Create Loan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}