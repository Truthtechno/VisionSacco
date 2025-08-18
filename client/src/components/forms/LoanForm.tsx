import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertLoanSchema, type InsertLoan, type MemberWithSavings } from "@shared/schema";
import { z } from "zod";

const loanFormSchema = insertLoanSchema.extend({
  disbursementDate: z.string(),
  dueDate: z.string(),
});

type LoanFormData = z.infer<typeof loanFormSchema>;

interface LoanFormProps {
  onSuccess: () => void;
}

export default function LoanForm({ onSuccess }: LoanFormProps) {
  const { toast } = useToast();

  const { data: members = [] } = useQuery<MemberWithSavings[]>({
    queryKey: ["/api/members"],
  });

  const form = useForm<LoanFormData>({
    resolver: zodResolver(loanFormSchema),
    defaultValues: {
      memberId: "",
      loanNumber: "",
      principal: "",
      interestRate: "15.00",
      termMonths: 12,
      disbursementDate: new Date().toISOString().split('T')[0],
      dueDate: "",
      status: "active",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: LoanFormData) => {
      const processedData = {
        ...data,
        disbursementDate: new Date(data.disbursementDate),
        dueDate: new Date(data.dueDate),
      };
      const response = await apiRequest("POST", "/api/loans", processedData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Success",
        description: "Loan created successfully",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create loan",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoanFormData) => {
    createMutation.mutate(data);
  };

  // Calculate due date based on disbursement date and term
  const handleDisbursementDateChange = (value: string) => {
    form.setValue("disbursementDate", value);
    const disbursementDate = new Date(value);
    const termMonths = form.getValues("termMonths");
    const dueDate = new Date(disbursementDate);
    dueDate.setMonth(dueDate.getMonth() + termMonths);
    form.setValue("dueDate", dueDate.toISOString().split('T')[0]);
  };

  const handleTermChange = (value: string) => {
    const termMonths = parseInt(value);
    form.setValue("termMonths", termMonths);
    const disbursementDate = new Date(form.getValues("disbursementDate"));
    const dueDate = new Date(disbursementDate);
    dueDate.setMonth(dueDate.getMonth() + termMonths);
    form.setValue("dueDate", dueDate.toISOString().split('T')[0]);
  };

  const isPending = createMutation.isPending;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="loan-form">
      {/* Member Selection */}
      <div className="space-y-2">
        <Label htmlFor="memberId">Member</Label>
        <Select
          value={form.watch("memberId")}
          onValueChange={(value) => form.setValue("memberId", value)}
          disabled={isPending}
        >
          <SelectTrigger data-testid="select-member">
            <SelectValue placeholder="Select a member" />
          </SelectTrigger>
          <SelectContent>
            {members.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.firstName} {member.lastName} ({member.memberNumber})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.memberId && (
          <p className="text-sm text-red-600" data-testid="error-member-id">
            {form.formState.errors.memberId.message}
          </p>
        )}
      </div>

      {/* Loan Number */}
      <div className="space-y-2">
        <Label htmlFor="loanNumber">Loan Number</Label>
        <Input
          id="loanNumber"
          {...form.register("loanNumber")}
          placeholder="e.g., LN001"
          disabled={isPending}
          data-testid="input-loan-number"
        />
        {form.formState.errors.loanNumber && (
          <p className="text-sm text-red-600" data-testid="error-loan-number">
            {form.formState.errors.loanNumber.message}
          </p>
        )}
      </div>

      {/* Principal Amount */}
      <div className="space-y-2">
        <Label htmlFor="principal">Principal Amount (UGX)</Label>
        <Input
          id="principal"
          type="number"
          step="1000"
          {...form.register("principal")}
          placeholder="1000000"
          disabled={isPending}
          data-testid="input-principal"
        />
        {form.formState.errors.principal && (
          <p className="text-sm text-red-600" data-testid="error-principal">
            {form.formState.errors.principal.message}
          </p>
        )}
      </div>

      {/* Interest Rate */}
      <div className="space-y-2">
        <Label htmlFor="interestRate">Interest Rate (%)</Label>
        <Input
          id="interestRate"
          type="number"
          step="0.01"
          {...form.register("interestRate")}
          placeholder="15.00"
          disabled={isPending}
          data-testid="input-interest-rate"
        />
        {form.formState.errors.interestRate && (
          <p className="text-sm text-red-600" data-testid="error-interest-rate">
            {form.formState.errors.interestRate.message}
          </p>
        )}
      </div>

      {/* Term in Months */}
      <div className="space-y-2">
        <Label htmlFor="termMonths">Loan Term (Months)</Label>
        <Select
          value={form.watch("termMonths").toString()}
          onValueChange={handleTermChange}
          disabled={isPending}
        >
          <SelectTrigger data-testid="select-term-months">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="6">6 months</SelectItem>
            <SelectItem value="12">12 months</SelectItem>
            <SelectItem value="18">18 months</SelectItem>
            <SelectItem value="24">24 months</SelectItem>
            <SelectItem value="36">36 months</SelectItem>
          </SelectContent>
        </Select>
        {form.formState.errors.termMonths && (
          <p className="text-sm text-red-600" data-testid="error-term-months">
            {form.formState.errors.termMonths.message}
          </p>
        )}
      </div>

      {/* Disbursement Date */}
      <div className="space-y-2">
        <Label htmlFor="disbursementDate">Disbursement Date</Label>
        <Input
          id="disbursementDate"
          type="date"
          value={form.watch("disbursementDate")}
          onChange={(e) => handleDisbursementDateChange(e.target.value)}
          disabled={isPending}
          data-testid="input-disbursement-date"
        />
        {form.formState.errors.disbursementDate && (
          <p className="text-sm text-red-600" data-testid="error-disbursement-date">
            {form.formState.errors.disbursementDate.message}
          </p>
        )}
      </div>

      {/* Due Date (auto-calculated) */}
      <div className="space-y-2">
        <Label htmlFor="dueDate">Due Date</Label>
        <Input
          id="dueDate"
          type="date"
          value={form.watch("dueDate")}
          disabled={true}
          className="bg-gray-50"
          data-testid="input-due-date"
        />
        <p className="text-xs text-gray-500">Automatically calculated based on disbursement date and term</p>
      </div>

      {/* Loan Summary */}
      {form.watch("principal") && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-2" data-testid="loan-summary">
          <h4 className="font-medium text-gray-900">Loan Summary</h4>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>Principal Amount:</span>
              <span>UGX {parseInt(form.watch("principal") || "0").toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Interest Rate:</span>
              <span>{form.watch("interestRate")}% per annum</span>
            </div>
            <div className="flex justify-between">
              <span>Term:</span>
              <span>{form.watch("termMonths")} months</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Monthly Payment (approx):</span>
              <span>
                UGX {Math.round(
                  (parseInt(form.watch("principal") || "0") * 
                   (1 + parseFloat(form.watch("interestRate")) / 100)) / 
                   form.watch("termMonths")
                ).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onSuccess}
          disabled={isPending}
          className="flex-1"
          data-testid="button-cancel"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="flex-1"
          data-testid="button-submit"
        >
          {isPending ? "Creating..." : "Create Loan"}
        </Button>
      </div>
    </form>
  );
}
