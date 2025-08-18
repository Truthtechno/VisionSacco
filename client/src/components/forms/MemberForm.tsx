import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertMemberSchema, type InsertMember, type MemberWithSavings } from "@shared/schema";
import { z } from "zod";

const memberFormSchema = insertMemberSchema.extend({
  confirmEmail: z.string().email("Invalid email format").optional(),
}).refine((data) => {
  if (data.email && data.confirmEmail) {
    return data.email === data.confirmEmail;
  }
  return true;
}, {
  message: "Email addresses must match",
  path: ["confirmEmail"],
});

type MemberFormData = z.infer<typeof memberFormSchema>;

interface MemberFormProps {
  member?: MemberWithSavings | null;
  onSuccess: () => void;
}

export default function MemberForm({ member, onSuccess }: MemberFormProps) {
  const { toast } = useToast();
  const isEditing = !!member;

  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: {
      memberNumber: member?.memberNumber || "",
      firstName: member?.firstName || "",
      lastName: member?.lastName || "",
      email: member?.email || "",
      confirmEmail: member?.email || "",
      phone: member?.phone || "",
      nationalId: member?.nationalId || "",
      address: member?.address || "",
      isActive: member?.isActive ?? true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertMember) => {
      const response = await apiRequest("POST", "/api/members", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Member created successfully",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create member",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertMember>) => {
      const response = await apiRequest("PUT", `/api/members/${member!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      toast({
        title: "Success",
        description: "Member updated successfully",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update member",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MemberFormData) => {
    const { confirmEmail, ...memberData } = data;
    
    if (isEditing) {
      updateMutation.mutate(memberData);
    } else {
      createMutation.mutate(memberData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-testid="member-form">
      {/* Member Number */}
      <div className="space-y-2">
        <Label htmlFor="memberNumber">Member Number</Label>
        <Input
          id="memberNumber"
          {...form.register("memberNumber")}
          placeholder="e.g., VFA001"
          disabled={isEditing || isPending}
          data-testid="input-member-number"
        />
        {form.formState.errors.memberNumber && (
          <p className="text-sm text-red-600" data-testid="error-member-number">
            {form.formState.errors.memberNumber.message}
          </p>
        )}
      </div>

      {/* First Name */}
      <div className="space-y-2">
        <Label htmlFor="firstName">First Name</Label>
        <Input
          id="firstName"
          {...form.register("firstName")}
          placeholder="Enter first name"
          disabled={isPending}
          data-testid="input-first-name"
        />
        {form.formState.errors.firstName && (
          <p className="text-sm text-red-600" data-testid="error-first-name">
            {form.formState.errors.firstName.message}
          </p>
        )}
      </div>

      {/* Last Name */}
      <div className="space-y-2">
        <Label htmlFor="lastName">Last Name</Label>
        <Input
          id="lastName"
          {...form.register("lastName")}
          placeholder="Enter last name"
          disabled={isPending}
          data-testid="input-last-name"
        />
        {form.formState.errors.lastName && (
          <p className="text-sm text-red-600" data-testid="error-last-name">
            {form.formState.errors.lastName.message}
          </p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          {...form.register("email")}
          placeholder="Enter email address"
          disabled={isPending}
          data-testid="input-email"
        />
        {form.formState.errors.email && (
          <p className="text-sm text-red-600" data-testid="error-email">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      {/* Confirm Email (only for new members) */}
      {!isEditing && (
        <div className="space-y-2">
          <Label htmlFor="confirmEmail">Confirm Email Address</Label>
          <Input
            id="confirmEmail"
            type="email"
            {...form.register("confirmEmail")}
            placeholder="Confirm email address"
            disabled={isPending}
            data-testid="input-confirm-email"
          />
          {form.formState.errors.confirmEmail && (
            <p className="text-sm text-red-600" data-testid="error-confirm-email">
              {form.formState.errors.confirmEmail.message}
            </p>
          )}
        </div>
      )}

      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          {...form.register("phone")}
          placeholder="+256701234567"
          disabled={isPending}
          data-testid="input-phone"
        />
        {form.formState.errors.phone && (
          <p className="text-sm text-red-600" data-testid="error-phone">
            {form.formState.errors.phone.message}
          </p>
        )}
      </div>

      {/* National ID */}
      <div className="space-y-2">
        <Label htmlFor="nationalId">National ID</Label>
        <Input
          id="nationalId"
          {...form.register("nationalId")}
          placeholder="Enter national ID number"
          disabled={isPending}
          data-testid="input-national-id"
        />
        {form.formState.errors.nationalId && (
          <p className="text-sm text-red-600" data-testid="error-national-id">
            {form.formState.errors.nationalId.message}
          </p>
        )}
      </div>

      {/* Address */}
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          {...form.register("address")}
          placeholder="Enter full address"
          rows={3}
          disabled={isPending}
          data-testid="input-address"
        />
        {form.formState.errors.address && (
          <p className="text-sm text-red-600" data-testid="error-address">
            {form.formState.errors.address.message}
          </p>
        )}
      </div>

      {/* Active Status (only for editing) */}
      {isEditing && (
        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={form.watch("isActive")}
            onCheckedChange={(checked) => form.setValue("isActive", checked)}
            disabled={isPending}
            data-testid="switch-is-active"
          />
          <Label htmlFor="isActive">Active Member</Label>
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
          {isPending ? "Saving..." : isEditing ? "Update Member" : "Create Member"}
        </Button>
      </div>
    </form>
  );
}
