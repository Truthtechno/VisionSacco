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
import { format } from "date-fns";

const paymentSchema = z.object({
  amount: z.string().min(1, "Amount is required").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "Amount must be a positive number"
  ),
  paymentMethod: z.enum(["cash", "bank_transfer", "mobile_money"], {
    required_error: "Payment method is required",
  }),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: any;
  currentUserId?: string;
}

export default function RecordPaymentModal({ isOpen, onClose, loan, currentUserId }: RecordPaymentModalProps) {
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
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentMethod: "cash",
    },
  });

  const createRepaymentMutation = useMutation({
    mutationFn: (data: PaymentFormData & { loanId: string; processedBy: string }) =>
      apiRequest("POST", "/api/repayments", data),
    onSuccess: () => {
      toast({
        title: "Payment recorded successfully",
        description: "The loan payment has been processed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repayments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      onClose();
      reset();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to record payment. Please try again.",
      });
    },
  });

  const onSubmit = (data: PaymentFormData) => {
    setIsSubmitting(true);
    createRepaymentMutation.mutate({
      ...data,
      loanId: loan.id,
      processedBy: currentUserId || "System Admin",
    }, {
      onSettled: () => setIsSubmitting(false),
    });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const watchedAmount = watch("amount");
  const remainingBalance = loan?.balance ? parseFloat(loan.balance) : 0;
  const paymentAmount = watchedAmount ? parseFloat(watchedAmount) : 0;
  const newBalance = Math.max(0, remainingBalance - paymentAmount);
  const willCloseLoan = newBalance === 0;

  if (!loan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Loan Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Loan Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Loan Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Loan Number:</span>
                <span className="ml-2 font-medium">{loan.loanNumber}</span>
              </div>
              <div>
                <span className="text-gray-600">Current Balance:</span>
                <span className="ml-2 font-medium text-red-600">
                  UGX {remainingBalance.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Principal:</span>
                <span className="ml-2 font-medium">UGX {parseFloat(loan.principal || 0).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-600">Interest Rate:</span>
                <span className="ml-2 font-medium">{loan.interestRate}%</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Payment Amount (UGX)</Label>
              <Input
                id="amount"
                type="number"
                step="1000"
                max={remainingBalance}
                placeholder="Enter payment amount"
                data-testid="input-payment-amount"
                {...register("amount")}
              />
              {errors.amount && (
                <p className="text-sm text-red-600">{errors.amount.message}</p>
              )}
              {paymentAmount > remainingBalance && (
                <p className="text-sm text-orange-600">
                  Payment amount exceeds remaining balance. Overpayment will be recorded.
                </p>
              )}
            </div>

            {/* Payment Summary */}
            {paymentAmount > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Payment Summary</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Payment Amount:</span>
                    <span className="ml-2 font-medium">UGX {paymentAmount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">New Balance:</span>
                    <span className="ml-2 font-medium">UGX {newBalance.toLocaleString()}</span>
                  </div>
                </div>
                {willCloseLoan && (
                  <p className="text-sm text-green-600 mt-2 font-medium">
                    ✓ This payment will close the loan
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select onValueChange={(value) => setValue("paymentMethod", value as any)} defaultValue="cash">
                <SelectTrigger data-testid="select-payment-method">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                </SelectContent>
              </Select>
              {errors.paymentMethod && (
                <p className="text-sm text-red-600">{errors.paymentMethod.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this payment"
                data-testid="input-payment-notes"
                {...register("notes")}
              />
              {errors.notes && (
                <p className="text-sm text-red-600">{errors.notes.message}</p>
              )}
            </div>

            <div className="text-xs text-gray-500">
              Payment will be recorded on: {format(new Date(), "MMM dd, yyyy 'at' h:mm a")}
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
                disabled={isSubmitting || !paymentAmount}
                data-testid="button-record-payment"
              >
                {isSubmitting ? "Recording..." : "Record Payment"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}