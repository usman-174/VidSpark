import React, { useState, useEffect } from "react";
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
import { Loader2, Upload, UserPlus, AlertCircle, Check, X } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "@/api/axiosInstance";
import useAuthStore from "@/store/authStore";

const Profile = () => {
  const { user } = useAuthStore();
  const [formState, setFormState] = useState({
    email: "",
    isLoading: false,
    file: null as File | null,
    isUploading: false,
    profileImage: user?.profileImage || null,
    isDialogOpen: false,
  });

  const [invitedUsers, setInvitedUsers] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchInvitedUsers();
  }, [user?.id]);

  const fetchInvitedUsers = async () => {
    try {
      const response = await axiosInstance.get("/invitations/get-invitations");
      setInvitedUsers(response.data);
    } catch (error) {
      toast.error("Failed to fetch invited users");
    }
  };

  const handleInvitation = async () => {
    if (!formState.email.trim()) {
      toast.error("Please enter a valid email address");
      return;
    }

    setFormState(prev => ({ ...prev, isLoading: true }));

    try {
      await axiosInstance.post("/invitations/send-invitation", {
        inviterId: user?.id,
        inviteeEmail: formState.email,
      });

      toast.success("Invitation sent successfully!");
      setFormState(prev => ({ ...prev, email: "" }));
      fetchInvitedUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to send invitation");
    } finally {
      setFormState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }
      setFormState(prev => ({ ...prev, file, isDialogOpen: true }));
    }
  };

  const handleImageUpload = async () => {
    if (!formState.file) return;

    setFormState(prev => ({ ...prev, isUploading: true }));
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", formState.file);

    try {
      const response = await axiosInstance.post("/uploads/profile-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.loaded / (progressEvent.total || 0) * 100;
          setUploadProgress(Math.round(progress));
        },
      });

      setFormState(prev => ({
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
      setFormState(prev => ({ ...prev, isUploading: false }));
      setUploadProgress(0);
    }
  };

  const InvitationStatus = ({ isUsed }: { isUsed: boolean }) => (
    <Badge variant={isUsed ? "outline" : "secondary"} className="ml-2">
      {isUsed ? (
        <Check className="w-3 h-3 mr-1" />
      ) : (
        <AlertCircle className="w-3 h-3 mr-1" />
      )}
      {isUsed ? "Accepted" : "Pending"}
    </Badge>
  );

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Profile Header */}
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="relative group">
              <Avatar className="h-20 w-20 cursor-pointer">
                <AvatarImage src={formState.profileImage || "/default-avatar.png"} />
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

      <div className="grid md:grid-cols-2 gap-6">
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
                onChange={(e) => setFormState(prev => ({ ...prev, email: e.target.value }))}
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

        {/* Invited Users Section */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Invited Users</CardTitle>
            <CardDescription>
              Track your sent invitations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invitedUsers.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No invitations sent yet
              </div>
            ) : (
              <div className="space-y-3">
                {invitedUsers.map((invite: any) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="font-medium">{invite.inviteeEmail}</span>
                    <InvitationStatus isUsed={invite.isUsed} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Image Upload Dialog */}
      <Dialog
        open={formState.isDialogOpen}
        onOpenChange={(open) => setFormState(prev => ({ ...prev, isDialogOpen: open }))}
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
              onClick={() => setFormState(prev => ({ ...prev, isDialogOpen: false }))}
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