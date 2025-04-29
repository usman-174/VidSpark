// src/pages/admin/AdminPolicyPage.tsx
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { PolicyType } from "@/types/policyTypes";
import { policyAPI } from "@/api/policyApi";

const PolicyCard = ({ id, credits, type, onUpdate }: {
  id: string;
  credits: number;
  type: PolicyType;
  onUpdate: (id: string, credits: number) => void;
}) => {
  const [newCredits, setNewCredits] = useState(credits.toString());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-md">{type} Policy</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={newCredits}
            onChange={(e) => setNewCredits(e.target.value)}
          />
          <Button onClick={() => onUpdate(id, Number(newCredits))}>Update</Button>
        </div>
        <div className="text-sm text-gray-500">Policy ID: {id}</div>
      </CardContent>
    </Card>
  );
};

export const AdminPolicyPage = () => {
  const queryClient = useQueryClient();
  const [credits, setCredits] = useState("");
  const [type, setType] = useState<PolicyType | "">("");

  const { data: policies, isLoading } = useQuery({
    queryKey: ["admin", "policies"],
    queryFn: policyAPI.getAll,
  });

  const createMutation = useMutation({
    mutationFn: ({ credits, type }: { credits: number; type: PolicyType }) =>
      policyAPI.create(credits, type),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin", "policies"] as any);
      setCredits("");
      setType("");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, credits }: { id: string; credits: number }) =>
      policyAPI.updateCredits(id, credits),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin", "policies"]as any);
    },
  });

  const handleCreate = () => {
    if (!credits || !type) return;
    createMutation.mutate({ credits: Number(credits), type: type as PolicyType });
  };

  const handleUpdate = (id: string, newCredits: number) => {
    updateMutation.mutate({ id, credits: newCredits });
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold">Manage Policies</h1>

      {/* <Card>
        <CardHeader>
          <CardTitle>Create New Policy</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4 items-start md:items-end">
          <Input
            placeholder="Credits"
            value={credits}
            onChange={(e) => setCredits(e.target.value)}
            type="number"
          />
          <Select value={type} onValueChange={(val) => setType(val as PolicyType)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Policy Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BASIC">BASIC</SelectItem>
              <SelectItem value="PREMIUM">PREMIUM</SelectItem>
              <SelectItem value="ADVANCED">ADVANCED</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleCreate}>Create</Button>
        </CardContent>
      </Card> */}

      <div className="grid gap-4 md:grid-cols-2">
        {isLoading
          ? Array(4)
              .fill(0)
              .map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
          : policies?.map((policy) => (
              <PolicyCard
                key={policy.id}
                id={policy.id}
                credits={policy.credits}
                type={policy.type}
                onUpdate={handleUpdate}
              />
            ))}
      </div>
    </div>
  );
};
