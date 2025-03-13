import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Upload,
  UserPlus,
  AlertCircle,
  Check,
  X,
  Clock,
  Filter,
  SortAsc,
  SortDesc,
  Mail,
  Calendar,
  Search,
  RefreshCw,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import toast from "react-hot-toast";
import axiosInstance from "@/api/axiosInstance";
import useAuthStore from "@/store/authStore";

// Type definitions
interface User {
  id: string;
  email: string;
  profileImage?: string | null;
  role: string;
}

interface Invitation {
  id: string;
  inviterId: string;
  inviteeEmail: string;
  inviteLink?: string | null;
  isUsed: boolean;
  expiresAt: string;
  createdAt: string;
}

interface FormState {
  email: string;
  isLoading: boolean;
  file: File | null;
  isUploading: boolean;
  profileImage: string | null;
  isDialogOpen: boolean;
}

interface SortOption {
  value: keyof Invitation;
  label: string;
}

const Profile = () => {
  const { user } = useAuthStore() as { user: User | null };
  const [formState, setFormState] = useState<FormState>({
    email: "",
    isLoading: false,
    file: null,
    isUploading: false,
    profileImage: user?.profileImage || null,
    isDialogOpen: false,
  });
  const [invitedUsers, setInvitedUsers] = useState<Invitation[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filter and sort states
  const [filterText, setFilterText] = useState("");
  const [sortField, setSortField] = useState<keyof Invitation>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Sort options
  const sortOptions: SortOption[] = [
    { value: "createdAt", label: "Date Created" },
    { value: "expiresAt", label: "Expiration Date" },
    { value: "inviteeEmail", label: "Email" },
    { value: "isUsed", label: "Status" },
  ];

  useEffect(() => {
    if (user?.id) {
      fetchInvitedUsers();
    }
  }, [user?.id]);

  const fetchInvitedUsers = async () => {
    if (!user?.id) return;
    
    setIsRefreshing(true);
    try {
      const response = await axiosInstance.get<Invitation[]>("/invitations/get-invitations");
      setInvitedUsers(response.data);
    } catch (error) {
      toast.error("Failed to fetch invited users");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleInvitation = async () => {
    if (!formState.email.trim()) {
      toast.error("Please enter a valid email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formState.email.trim())) {
      toast.error("Please enter a valid email format");
      return;
    }

    setFormState((prev) => ({ ...prev, isLoading: true }));

    try {
      await axiosInstance.post("/invitations/send-invitation", {
        inviterId: user?.id,
        inviteeEmail: formState.email,
      });

      toast.success("Invitation sent successfully!");
      setFormState((prev) => ({ ...prev, email: "" }));
      fetchInvitedUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to send invitation");
    } finally {
      setFormState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }
      setFormState((prev) => ({ ...prev, file, isDialogOpen: true }));
    }
  };

  const handleImageUpload = async () => {
    if (!formState.file) return;

    setFormState((prev) => ({ ...prev, isUploading: true }));
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", formState.file);

    try {
      const response = await axiosInstance.post("/uploads/profile-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const progress =
            (progressEvent.loaded / (progressEvent.total || 0)) * 100;
          setUploadProgress(Math.round(progress));
        },
      });

      setFormState((prev) => ({
        ...prev,
        profileImage: response.data.imageUrl,
        file: null,
        isDialogOpen: false,
        isUploading: false,
      }));

      toast.success("Profile picture updated successfully!");
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setFormState((prev) => ({ ...prev, isUploading: false }));
      setUploadProgress(0);
    }
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if invitation is expired
  const isExpired = (expiryDate: string): boolean => {
    return new Date(expiryDate) < new Date();
  };

  // Time remaining calculation
  const getTimeRemaining = (expiryDate: string): string => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    
    if (now > expiry) return "";
    
    const diffMs = expiry.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} remaining`;
    } else {
      const hours = Math.floor(diffMins / 60);
      return `${hours} hour${hours !== 1 ? 's' : ''} remaining`;
    }
  };

  // Derived state: filtered and sorted invitations
  const processedInvitedUsers = useMemo(() => {
    let list = [...invitedUsers];

    // Filter by invitee email
    if (filterText.trim()) {
      list = list.filter((invite) =>
        invite.inviteeEmail.toLowerCase().includes(filterText.toLowerCase())
      );
    }

    // Sort by selected field
    list.sort((a:any, b:any) => {
      // Special handling for boolean isUsed field
      if (sortField === "isUsed") {
        return sortOrder === "asc" 
          ? (a.isUsed === b.isUsed ? 0 : a.isUsed ? 1 : -1)
          : (a.isUsed === b.isUsed ? 0 : a.isUsed ? -1 : 1);
      }
      
      let compareA = a[sortField];
      let compareB = b[sortField];

      // If sorting by dates, convert to Date objects
      if (sortField === "createdAt" || sortField === "expiresAt") {
        compareA = new Date(compareA).getTime();
        compareB = new Date(compareB).getTime();
      }
      
      if (compareA < compareB) return sortOrder === "asc" ? -1 : 1;
      if (compareA > compareB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [invitedUsers, filterText, sortField, sortOrder]);

  // Helper component for invitation status badge
  const InvitationStatus = ({ 
    isUsed, 
    expiresAt 
  }: { 
    isUsed: boolean; 
    expiresAt: string 
  }) => {
    if (isUsed) {
      return (
        <Badge variant="default" className="ml-2">
          <Check className="w-3 h-3 mr-1" />
          Accepted
        </Badge>
      );
    }
    
    if (isExpired(expiresAt)) {
      return (
        <Badge variant="destructive" className="ml-2">
          <X className="w-3 h-3 mr-1" />
          Expired
        </Badge>
      );
    }
    
    return (
      <Badge variant="secondary" className="ml-2">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Profile Header */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="relative group">
              <Avatar className="h-20 w-20 cursor-pointer">
                <AvatarImage
                  src={formState.profileImage || "/default-avatar.png"}
                />
                <AvatarFallback className="text-lg">
                  {user?.email?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <label className="cursor-pointer p-2">
                  <Upload className="h-6 w-6 text-white" />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileSelect}
                  />
                </label>
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl">{user?.email}</CardTitle>
              <CardDescription>
                <Badge variant="outline" className="mt-1">
                  {user?.role}
                </Badge>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-2 gap-6 items-baseline">
        {/* Invite Friend Section */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="w-5 h-5 mr-2" />
              Invite a Friend
            </CardTitle>
            <CardDescription>
              Send an invitation to join the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                type="email"
                placeholder="friend@example.com"
                value={formState.email}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
              />
              <Button
                className="w-full"
                onClick={handleInvitation}
                disabled={formState.isLoading || !formState.email}
              >
                {formState.isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Invitation"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Improved Invited Users Section */}
        <Card className="shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Invited Users</CardTitle>
                <CardDescription>
                  Track your sent invitations
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={fetchInvitedUsers}
                disabled={isRefreshing}
                title="Refresh invitations"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filter and sort controls */}
            <div className="mb-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filter by email..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="pl-8"
                />
              </div>
              
              <div className="flex gap-2">
                <Select
                  value={sortField}
                  onValueChange={(value) => setSortField(value as keyof Invitation)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  title={sortOrder === "asc" ? "Sort descending" : "Sort ascending"}
                >
                  {sortOrder === "asc" ? 
                    <SortAsc className="h-4 w-4" /> : 
                    <SortDesc className="h-4 w-4" />
                  }
                </Button>
              </div>
            </div>

            {/* Stats summary */}
            {invitedUsers.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-gray-50 p-2 rounded-lg text-center">
                  <div className="text-lg font-semibold">{invitedUsers.length}</div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
                <div className="bg-gray-50 p-2 rounded-lg text-center">
                  <div className="text-lg font-semibold">
                    {invitedUsers.filter(invite => invite.isUsed).length}
                  </div>
                  <div className="text-xs text-gray-500">Accepted</div>
                </div>
                <div className="bg-gray-50 p-2 rounded-lg text-center">
                  <div className="text-lg font-semibold">
                    {invitedUsers.filter(invite => 
                      !invite.isUsed && !isExpired(invite.expiresAt)
                    ).length}
                  </div>
                  <div className="text-xs text-gray-500">Pending</div>
                </div>
              </div>
            )}

            {/* Invitation list */}
            {processedInvitedUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {filterText ? "No matching invitations found" : "No invitations sent yet"}
              </div>
            ) : (
              <div className="space-y-3">
                {processedInvitedUsers.map((invite) => (
                  <div
                    key={invite.id}
                    className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="font-medium">{invite.inviteeEmail}</span>
                      </div>
                      <InvitationStatus 
                        isUsed={invite.isUsed} 
                        expiresAt={invite.expiresAt} 
                      />
                    </div>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      
                      <span>Sent: {formatDate(invite.createdAt)}</span>
                      {!invite.isUsed && (
                        <span className="ml-auto font-medium text-xs">
                          {getTimeRemaining(invite.expiresAt)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between pt-0">
            <div className="text-xs text-gray-500">
              {processedInvitedUsers.length > 0 && (
                <>Showing {processedInvitedUsers.length} of {invitedUsers.length} invitations</>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Image Upload Dialog */}
      <Dialog
        open={formState.isDialogOpen}
        onOpenChange={(open) =>
          setFormState((prev) => ({ ...prev, isDialogOpen: open }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Profile Picture</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {formState.isUploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} />
                <p className="text-sm text-center text-gray-500">
                  Uploading... {uploadProgress}%
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setFormState((prev) => ({ ...prev, isDialogOpen: false }))
              }
            >
              Cancel
            </Button>
            <Button
              onClick={handleImageUpload}
              disabled={formState.isUploading}
            >
              {formState.isUploading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;