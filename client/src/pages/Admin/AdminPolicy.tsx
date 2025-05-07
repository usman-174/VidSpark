import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { policyAPI } from "@/api/policyApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { PolicyType } from "@/types/policyTypes";
import { toast } from "react-hot-toast"; // ✅ using 'sonner' for better toasts (lightweight)
import { motion, AnimatePresence } from "framer-motion"; // ✅ for smooth animations

const PolicyCard = ({
  id,
  credits,
  type,
  onUpdate,
  isUpdating,
}: {
  id: string;
  credits: number;
  type: PolicyType;
  onUpdate: (id: string, credits: number) => void;
  isUpdating: boolean;
}) => {
  const [newCredits, setNewCredits] = useState(credits.toString());

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">{type} Policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={newCredits}
              onChange={(e) => setNewCredits(e.target.value)}
              min={0}
              placeholder="Enter new credits"
              className="w-full"
            />
            <Button
              onClick={() => onUpdate(id, Number(newCredits))}
              disabled={isUpdating || newCredits === ""}
              size="sm"
            >
              {isUpdating ? "Updating..." : "Update"}
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">ID: {id}</div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const AdminPolicyPage = () => {
  const queryClient = useQueryClient();

  const { data: policies, isLoading } = useQuery({
    queryKey: ["admin", "policies"],
    queryFn: policyAPI.getAll,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, credits }: { id: string; credits: number }) =>
      policyAPI.updateCredits(id, credits),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin", "policies"]as any);
      toast.success("Policy updated successfully!");
    },
    onError: () => {
      toast.error("Failed to update policy. Please try again.");
    },
  });

  const handleUpdate = (id: string, newCredits: number) => {
    if (isNaN(newCredits) || newCredits < 0) {
      toast.error("Please enter a valid credit amount.");
      return;
    }
    updateMutation.mutate({ id, credits: newCredits });
  };

  return (
    <div className="space-y-8 p-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between md:items-center">
        <h1 className="text-3xl font-bold">Manage Policies</h1>
        {/* Future: Add "Create Policy" button here if needed */}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array(6)
            .fill(0)
            .map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)
        ) : (
          <AnimatePresence>
            {policies?.map((policy) => (
              <PolicyCard
                key={policy.id}
                id={policy.id}
                credits={policy.credits}
                type={policy.type}
                onUpdate={handleUpdate}
                isUpdating={updateMutation.isPending}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
