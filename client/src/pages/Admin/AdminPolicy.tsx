import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { policyAPI } from "@/api/policyApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { PolicyType } from "@/types/policyTypes";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center justify-between">
            <span>{type} Policy</span>
            <span className="text-sm font-medium bg-muted px-2 py-1 rounded text-muted-foreground">
              {credits} credits
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Update Credits</label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={newCredits}
                onChange={(e) => setNewCredits(e.target.value)}
                min={0}
                placeholder="Enter credits"
                className="flex-1"
              />
              <Button
                onClick={() => onUpdate(id, Number(newCredits))}
                disabled={isUpdating || newCredits === "" || Number(newCredits) === credits}
                size="sm"
                className="shrink-0"
              >
                {isUpdating ? "Updating..." : "Update"}
              </Button>
            </div>
          </div>
          
          <div className="pt-2 border-t text-xs text-muted-foreground">
            <span className="font-medium">ID:</span> {id}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const AdminPolicyPage = () => {
  const queryClient = useQueryClient();
  const [updatingPolicyId, setUpdatingPolicyId] = useState<string | null>(null);
  
  const { data: policies, isLoading } = useQuery({
    queryKey: ["admin", "policies"],
    queryFn: policyAPI.getAll,
  });
  
  const updateMutation = useMutation({
    mutationFn: ({ id, credits }: { id: string; credits: number }) =>
      policyAPI.updateCredits(id, credits),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin", "policies"] as any);
      toast.success("Policy updated successfully!");
      setUpdatingPolicyId(null);
    },
    onError: () => {
      toast.error("Failed to update policy. Please try again.");
      setUpdatingPolicyId(null);
    },
  });
  
  const handleUpdate = (id: string, newCredits: number) => {
    if (isNaN(newCredits) || newCredits < 0) {
      toast.error("Please enter a valid credit amount.");
      return;
    }
    setUpdatingPolicyId(id);
    updateMutation.mutate({ id, credits: newCredits });
  };
  
  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Manage Policies</h1>
          <p className="text-muted-foreground">Update credit allocations for different policy types</p>
        </div>
        
        {policies && (
          <div className="flex items-center gap-6 text-sm">
            <div className="text-muted-foreground">
              <span className="font-medium text-foreground">{policies.length}</span> policies
            </div>
            <div className="text-muted-foreground">
              <span className="font-medium text-foreground">
                {policies.reduce((sum, p) => sum + p.credits, 0)}
              </span> total credits
            </div>
          </div>
        )}
      </div>
      
      {/* Content */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-lg" />
            ))}
        </div>
      ) : policies && policies.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {policies.map((policy) => (
              <PolicyCard
                key={policy.id}
                id={policy.id}
                credits={policy.credits}
                type={policy.type}
                onUpdate={handleUpdate}
                isUpdating={updatingPolicyId === policy.id}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-muted-foreground">No policies found</div>
        </div>
      )}
    </div>
  );
};