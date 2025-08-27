import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const loanRequestSchema = z.object({
  principal: z.string().min(1, "Amount is required").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Amount must be a positive number"
  ),
  termMonths: z.number().min(1, "Term is required"),
  intendedPurpose: z.string().min(1, "Purpose is required"),
});

type LoanRequestFormData = z.infer<typeof loanRequestSchema>;

interface RequestLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: string;
}

export default function RequestLoanModal({ isOpen, onClose, memberId }: RequestLoanModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<LoanRequestFormData>({
    resolver: zodResolver(loanRequestSchema),
    defaultValues: {
      termMonths: 12,
    },
  });

  const createLoanMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest("/api/loans", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({
        title: "Loan request submitted",
        description: "Your loan application has been submitted for review.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      onClose();
      reset();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit loan request. Please try again.",
      });
    },
  });

  const onSubmit = (data: LoanRequestFormData) => {
    setIsSubmitting(true);
    // Generate loan number automatically
    const loanNumber = `LN${String(Date.now()).slice(-6)}`;
    const loanData = {
      ...data,
      loanNumber,
      memberId,
      status: "pending",
      interestRate: "15.00", // Default rate
      balance: data.principal,
    };
    createLoanMutation.mutate(loanData, {
      onSettled: () => setIsSubmitting(false),
    });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const watchedAmount = watch("principal");
  const watchedTerm = watch("termMonths");
  const loanAmount = watchedAmount ? parseFloat(watchedAmount) : 0;
  const interestRate = 15; // Default 15% annual rate
  const monthlyInterest = interestRate / 100 / 12;
  const monthlyPayment = loanAmount > 0 && watchedTerm > 0 ? 
    (loanAmount * monthlyInterest * Math.pow(1 + monthlyInterest, watchedTerm)) / 
    (Math.pow(1 + monthlyInterest, watchedTerm) - 1) : 0;
  const totalPayment = monthlyPayment * watchedTerm;
  const totalInterest = totalPayment - loanAmount;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request a Loan</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="principal">Loan Amount (UGX)</Label>
            <Input
              id="principal"
              type="number"
              step="10000"
              min="50000"
              max="10000000"
              placeholder="Enter requested amount"
              data-testid="input-loan-amount"
              {...register("principal")}
            />
            {errors.principal && (
              <p className="text-sm text-red-600">{errors.principal.message}</p>
            )}
            <p className="text-xs text-gray-600">
              Minimum: UGX 50,000 | Maximum: UGX 10,000,000
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="termMonths">Repayment Term</Label>
            <Select onValueChange={(value) => setValue("termMonths", parseInt(value))} defaultValue="12">
              <SelectTrigger data-testid="select-loan-term">
                <SelectValue placeholder="Select repayment term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6 months</SelectItem>
                <SelectItem value="12">12 months</SelectItem>
                <SelectItem value="18">18 months</SelectItem>
                <SelectItem value="24">24 months (2 years)</SelectItem>
                <SelectItem value="36">36 months (3 years)</SelectItem>
              </SelectContent>
            </Select>
            {errors.termMonths && (
              <p className="text-sm text-red-600">{errors.termMonths.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="intendedPurpose">Purpose of Loan</Label>
            <Select onValueChange={(value) => setValue("intendedPurpose", value)}>
              <SelectTrigger data-testid="select-loan-purpose">
                <SelectValue placeholder="Select loan purpose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Business Expansion">Business Expansion</SelectItem>
                <SelectItem value="Equipment Purchase">Equipment Purchase</SelectItem>
                <SelectItem value="Education Fees">Education Fees</SelectItem>
                <SelectItem value="Medical Expenses">Medical Expenses</SelectItem>
                <SelectItem value="Agriculture">Agriculture</SelectItem>
                <SelectItem value="Housing">Housing</SelectItem>
                <SelectItem value="Emergency">Emergency</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.intendedPurpose && (
              <p className="text-sm text-red-600">{errors.intendedPurpose.message}</p>
            )}
          </div>

          {/* Loan Calculator */}
          {loanAmount > 0 && watchedTerm > 0 && (
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
              <h4 className="font-medium text-emerald-900 mb-3">Loan Calculation Preview</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-emerald-700">Principal:</span>
                  <span className="ml-2 font-medium">UGX {loanAmount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-emerald-700">Interest Rate:</span>
                  <span className="ml-2 font-medium">{interestRate}% per year</span>
                </div>
                <div>
                  <span className="text-emerald-700">Monthly Payment:</span>
                  <span className="ml-2 font-medium">UGX {monthlyPayment.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-emerald-700">Total Interest:</span>
                  <span className="ml-2 font-medium">UGX {totalInterest.toLocaleString()}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-emerald-700">Total Repayment:</span>
                  <span className="ml-2 font-medium text-lg">UGX {totalPayment.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Important Information</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Your loan application will be reviewed by our team</li>
              <li>• Approval is subject to credit assessment and SACCO policies</li>
              <li>• Interest rates are competitive and fixed for the loan term</li>
              <li>• Early repayment is allowed with potential interest savings</li>
            </ul>
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
              data-testid="button-submit-loan-request"
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}