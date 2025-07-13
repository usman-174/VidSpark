// src/pages/admin/PackagesPage.tsx
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Loader2, 
  Pencil, 
  Plus, 
  Trash2, 
  Search,
  Filter,
  Package as PackageIcon,
  CreditCard,
  DollarSign,
  X,
  Coins
} from "lucide-react";
import { Package, PackageFormData, packagesAPI } from "@/api/pacakgesApi";
import toast from "react-hot-toast";

type PriceFilter = "ALL" | "LOW" | "MEDIUM" | "HIGH";

export default function PackagesPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [formData, setFormData] = useState<PackageFormData>({
    name: "",
    credits: 0,
    price: 0,
  });

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("ALL");

  // Queries
  const { data: packages = [], isLoading } = useQuery({
    queryKey: ["packages"],
    queryFn: packagesAPI.getPackages,
  });

  // Filtered and searched packages
  const filteredPackages = useMemo(() => {
    let filtered = packages;

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((pkg: Package) => 
        pkg.name?.toLowerCase().includes(searchLower)
      );
    }

    // Apply price filter
    if (priceFilter !== "ALL") {
      filtered = filtered.filter((pkg: Package) => {
        const price = pkg.price;
        switch (priceFilter) {
          case "LOW":
            return price < 10;
          case "MEDIUM":
            return price >= 10 && price < 50;
          case "HIGH":
            return price >= 50;
          default:
            return true;
        }
      });
    }

    // Sort by price ascending
    return filtered.sort((a: Package, b: Package) => a.price - b.price);
  }, [packages, searchTerm, priceFilter]);

  // Stats
  const stats = useMemo(() => {
    const totalPackages = packages.length;
    const avgPrice = packages.length > 0 
      ? packages.reduce((sum: number, pkg: Package) => sum + pkg.price, 0) / packages.length 
      : 0;
    const totalCredits = packages.reduce((sum: number, pkg: Package) => sum + pkg.credits, 0);
    const avgCreditsPerDollar = packages.length > 0
      ? packages.reduce((sum: number, pkg: Package) => sum + (pkg.credits / pkg.price), 0) / packages.length
      : 0;
    
    return { totalPackages, avgPrice, totalCredits, avgCreditsPerDollar };
  }, [packages]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: packagesAPI.createPackage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      toast.success("Package created successfully", {
        duration: 3000,
        position: "top-right",
      });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Error creating package", {
        duration: 4000,
        position: "top-right",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: packagesAPI.updatePackage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      toast.success("Package updated successfully", {
        duration: 3000,
        position: "top-right",
      });
      setIsEditOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error?.message || "Error updating package", {
        duration: 4000,
        position: "top-right",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: packagesAPI.deletePackage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packages"] });
      toast.success("Package deleted successfully", {
        duration: 3000,
        position: "top-right",
      });
      setIsDeleteOpen(false);
      setSelectedPackage(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Error deleting package", {
        duration: 4000,
        position: "top-right",
      });
    },
  });

  // Handlers
  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast.error("Package name is required");
      return;
    }
    if (formData.credits <= 0) {
      toast.error("Credits must be greater than 0");
      return;
    }
    if (formData.price <= 0) {
      toast.error("Price must be greater than 0");
      return;
    }
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!selectedPackage) return;
    if (!formData.name.trim()) {
      toast.error("Package name is required");
      return;
    }
    if (formData.credits <= 0) {
      toast.error("Credits must be greater than 0");
      return;
    }
    if (formData.price <= 0) {
      toast.error("Price must be greater than 0");
      return;
    }
    updateMutation.mutate({
      id: selectedPackage.id,
      data: formData,
    });
  };

  const handleDelete = () => {
    if (!selectedPackage) return;
    deleteMutation.mutate(selectedPackage.id);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsCreateOpen(true);
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

  const clearFilters = () => {
    setSearchTerm("");
    setPriceFilter("ALL");
  };

  const getPriceRangeBadge = (price: number) => {
    if (price < 10) return { variant: "secondary" as const, label: "Budget" };
    if (price < 50) return { variant: "default" as const, label: "Standard" };
    return { variant: "destructive" as const, label: "Premium" };
  };

  const getValueScore = (credits: number, price: number) => {
    return Math.round(credits / price);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Loading packages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Credit Packages</h1>
          <p className="text-muted-foreground mt-1">
            Manage subscription plans and pricing
          </p>
        </div>
        <Button onClick={openCreateDialog} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Add Package
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Packages</CardTitle>
            <PackageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPackages}</div>
            <p className="text-xs text-muted-foreground">
              Available plans
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.avgPrice.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Per package
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCredits.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all packages
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Value</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgCreditsPerDollar.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Credits per dollar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter</CardTitle>
          <CardDescription>
            Find packages by name and filter by price range
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by package name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={priceFilter} onValueChange={(value: PriceFilter) => setPriceFilter(value)}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Prices</SelectItem>
                  <SelectItem value="LOW">Budget (&lt;$10)</SelectItem>
                  <SelectItem value="MEDIUM">Standard ($10-$50)</SelectItem>
                  <SelectItem value="HIGH">Premium ($50+)</SelectItem>
                </SelectContent>
              </Select>
              {(searchTerm || priceFilter !== "ALL") && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={clearFilters}
                  className="shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          {/* Active filters display */}
          {(searchTerm || priceFilter !== "ALL") && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Active filters:</span>
              {searchTerm && (
                <Badge variant="secondary" className="gap-1">
                  Search: "{searchTerm}"
                </Badge>
              )}
              {priceFilter !== "ALL" && (
                <Badge variant="secondary" className="gap-1">
                  Price: {priceFilter}
                </Badge>
              )}
              <span>• {filteredPackages.length} results</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Packages Table */}
      <Card>
        <CardHeader>
          <CardTitle>Package List</CardTitle>
          <CardDescription>
            {filteredPackages.length} of {packages.length} packages
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPackages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <PackageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No packages found</p>
              <p className="text-sm mb-4">
                {searchTerm || priceFilter !== "ALL" 
                  ? "Try adjusting your search or filter criteria"
                  : "No packages have been created yet"
                }
              </p>
              {packages.length === 0 && (
                <Button onClick={openCreateDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Package
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Package Name</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Value Score</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPackages.map((pkg: Package) => {
                  const priceRange = getPriceRangeBadge(pkg.price);
                  const valueScore = getValueScore(pkg.credits, pkg.price);
                  
                  return (
                    <TableRow key={pkg.id}>
                      <TableCell className="font-medium">{pkg.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Coins className="h-4 w-4 text-muted-foreground" />
                          {pkg.credits.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${pkg.price.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          {valueScore} credits/$
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={priceRange.variant}>
                          {priceRange.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(pkg)}
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(pkg)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
              Fill in the details for the credit package. The value score will be calculated automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Package Name</Label>
              <Input
                id="name"
                placeholder="e.g., Starter Pack, Pro Bundle"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="credits">Credits</Label>
                <Input
                  id="credits"
                  type="number"
                  min="1"
                  placeholder="100"
                  value={formData.credits || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, credits: Number(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="9.99"
                  value={formData.price || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, price: Number(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            {formData.credits > 0 && formData.price > 0 && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Preview:</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-medium">Value Score:</span>
                  <Badge variant="outline">
                    {getValueScore(formData.credits, formData.price)} credits per $1
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Category:</span>
                  <Badge variant={getPriceRangeBadge(formData.price).variant}>
                    {getPriceRangeBadge(formData.price).label}
                  </Badge>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                setIsEditOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={isCreateOpen ? handleCreate : handleUpdate}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isCreateOpen ? "Create Package" : "Update Package"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the{" "}
              <span className="font-semibold">"{selectedPackage?.name}"</span> package
              and remove it from all user options.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete Package
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}