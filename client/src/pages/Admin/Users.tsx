// src/pages/admin/UsersPage.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, User as UserIcon, Loader2 } from "lucide-react";
import { UserFormData, usersAPI } from "@/api/usersApi";
import { User } from "@/store/authStore";

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    role: "USER",
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: usersAPI.getUsers,
  });

  const updateMutation = useMutation({
    mutationFn: usersAPI.updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "User role updated successfully" });
      setIsEditOpen(false);
      resetForm();
    },
    onError: () => {
      toast({
        title: "Error updating user role",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: usersAPI.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "User deleted successfully" });
      setIsDeleteOpen(false);
    },
    onError: () => {
      toast({
        title: "Error deleting user",
        variant: "destructive",
      });
    },
  });

  const handleUpdate = () => {
    if (!selectedUser) return;
    updateMutation.mutate({
      id: selectedUser.id,
      data: { role: formData.role },
    });
  };

  const handleDelete = () => {
    if (!selectedUser) return;
    deleteMutation.mutate(selectedUser.id);
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({ role: user.role });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  const resetForm = () => {
    setFormData({ role: "USER" });
    setSelectedUser(null);
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
        <h1 className="text-2xl font-bold">Users</h1>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Credits</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user: User) => (
            <TableRow key={user.id}>
              <TableCell>
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.email || "User"}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <UserIcon className="w-8 h-8 p-1 rounded-full bg-gray-100" />
                )}
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>{user.totalCredits}</TableCell>
              <TableCell>
                {new Date(user.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openEditDialog(user)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => openDeleteDialog(user)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Edit Role Dialog */}
      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsEditOpen(false);
            resetForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value: "USER" | "ADMIN") =>
                  setFormData({ role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update Role
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
              user account and all associated data.
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
