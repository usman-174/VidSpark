import React, { useState, useEffect } from "react";
import axiosInstance from "@/api/axiosInstance";
import useAuthStore from "@/store/authStore";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import toast, { Toaster } from "react-hot-toast";

const Profile: React.FC = () => {
  const { user } = useAuthStore();
  const [email, setEmail] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(user?.profileImage || null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [invitedUsers, setInvitedUsers] = useState<any[]>([]);

  const inviterId = user?.id;

  useEffect(() => {
    if (inviterId) {
      fetchInvitedUsers();
    }
  }, [inviterId]);

  const fetchInvitedUsers = async () => {
    try {
      const response = await axiosInstance.get("/invitations/get-invitations");
      setInvitedUsers(response.data);
    } catch (error) {
      toast.error("Failed to fetch invited users.");
    }
  };

  const handleSendInvitation = async () => {
    if (!inviterId) {
      toast.error("User ID is missing. Please log in.");
      return;
    }

    setIsSending(true);
    toast.loading("Sending invitation...");

    try {
      await axiosInstance.post("/invitations/send-invitation", {
        inviterId,
        inviteeEmail: email,
      });

      toast.dismiss();
      toast.success("Invitation sent successfully!");
      setEmail("");
      fetchInvitedUsers();
    } catch (error: any) {
      toast.dismiss();
      const errorMsg = error.response?.data?.error || "Error sending invitation.";
      toast.error(errorMsg);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleImageUpload = async () => {
    if (!file) {
      toast.error("Please select an image to upload.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axiosInstance.post("/uploads/profile-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const imageUrl = response.data.imageUrl;
      setUploadedImage(imageUrl);
      setFile(null);
      toast.success("Profile picture updated!");
    } catch (error) {
      toast.error("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
      setIsDialogOpen(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Toaster position="top-right" />
      
      {/* Profile Card */}
      <Card className="max-w-md mx-auto shadow-lg rounded-lg overflow-hidden">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage src={uploadedImage || "/default-avatar.png"} alt="Profile Image" />
              <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg font-semibold">{user?.email}</CardTitle>
              <p className="text-sm text-gray-500">Role: {user?.role}</p>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      {/* Invited Users */}
      <Card className="max-w-md mx-auto shadow-lg rounded-lg overflow-hidden">
        <CardHeader>
          <CardTitle>Invited Users</CardTitle>
          <p className="text-sm text-gray-600">List of people you've invited.</p>
        </CardHeader>
        <CardContent>
          {invitedUsers.length === 0 ? (
            <p className="text-center text-gray-500">No invitations sent yet.</p>
          ) : (
            <ul className="space-y-2">
              {invitedUsers.map((invite) => (
                <li key={invite.id} className="p-2 border rounded-md">
                  <p className="text-sm font-medium">{invite.inviteeEmail}</p>
                  <p className="text-xs text-gray-500">Status: {invite.isUsed ? "Accepted" : "Pending"}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      
      {/* Invite Friend */}
      <Card className="max-w-md mx-auto shadow-lg rounded-lg overflow-hidden">
        <CardHeader>
          <CardTitle>Invite a Friend</CardTitle>
        </CardHeader>
        <CardContent>
          <Input type="email" placeholder="Enter your friend's email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button onClick={handleSendInvitation} disabled={isSending || !email} className="mt-4 w-full bg-red-600 text-white hover:bg-red-700">
            {isSending ? "Sending..." : "Send Invitation"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
