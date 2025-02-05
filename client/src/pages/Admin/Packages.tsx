// src/pages/admin/PackagesPage.tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Package, PackageFormData, packagesAPI } from "@/api/pacakgesApi";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";

export default function PackagesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [formData, setFormData] = useState<PackageFormData>({
    name: "",
    credits: 0,
    price: 0,
  });

  // Queries
  const { data: packages = [], isLoading } = useQuery({
    queryKey: ["packages"],
    queryFn: packagesAPI.getPackages,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: packagesAPI.createPackage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      toast({ title: "Package created successfully" });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error creating package",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: packagesAPI.updatePackage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      toast({ title: "Package updated successfully" });
      setIsEditOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error updating package",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: packagesAPI.deletePackage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      toast({ title: "Package deleted successfully" });
      setIsDeleteOpen(false);
    },
    onError: () => {
      toast({
        title: "Error deleting package",
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!selectedPackage) return;
    updateMutation.mutate({
      id: selectedPackage.id,
      data: formData,
    });
  };

  const handleDelete = () => {
    if (!selectedPackage) return;
    deleteMutation.mutate(selectedPackage.id);
  };

  const openEditDialog = (pkg: Package) => {
    setSelectedPackage(pkg);
    setFormData({
      name: pkg.name,
      credits: pkg.credits,
      price: pkg.price,
    });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (pkg: Package) => {
    setSelectedPackage(pkg);
    setIsDeleteOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: "", credits: 0, price: 0 });
    setSelectedPackage(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Credit Packages</h1>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Package
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Credits</TableHead>
            <TableHead>Price</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {packages.map((pkg: Package) => (
            <TableRow key={pkg.id}>
              <TableCell>{pkg.name}</TableCell>
              <TableCell>{pkg.credits}</TableCell>
              <TableCell>${pkg.price}</TableCell>
              <TableCell className="space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEditDialog(pkg)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openDeleteDialog(pkg)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Create/Edit Dialog */}
      <Dialog
        open={isCreateOpen || isEditOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setIsEditOpen(false);
            resetForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isCreateOpen ? "Create Package" : "Edit Package"}
            </DialogTitle>
            <DialogDescription>
              Fill in the details for the credit package.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="credits">Credits</Label>
              <Input
                id="credits"
                type="number"
                value={formData.credits}
                onChange={(e) =>
                  setFormData({ ...formData, credits: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: Number(e.target.value) })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={isCreateOpen ? handleCreate : handleUpdate}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isCreateOpen ? "Create" : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              credit package.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
