import React, { useState } from "react";
import axiosInstance from "@/api/axiosInstance";
import useAuthStore from "@/store/authStore";
import { 
  Card, CardHeader, CardTitle, CardContent 
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

  const inviterId = user?.id;

  // Handle invitation sending
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
    } catch (error: any) {
      toast.dismiss();
      const errorMsg = error.response?.data?.error || "Error sending invitation.";
      toast.error(errorMsg);
    } finally {
      setIsSending(false);
    }
  };

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  // Handle image upload
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
    <div className="container mx-auto p-4">
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
        <CardContent>
          <Button onClick={() => setIsDialogOpen(true)}>Change Profile Picture</Button>
        </CardContent>
      </Card>

      {/* Upload Profile Picture Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="p-6">
          <DialogHeader>
            <DialogTitle>Update Profile Picture</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <input type="file" accept="image/*" onChange={handleFileChange} className="w-full" />
            {file && (
              <div className="mt-2">
                <p>Selected: {file.name}</p>
                <img
                  src={URL.createObjectURL(file)}
                  alt="Preview"
                  className="mt-2 w-32 h-32 object-cover rounded-full border"
                />
              </div>
            )}
            {uploading && <Progress value={50} className="w-full" />}
          </div>
          <DialogFooter>
            <Button onClick={handleImageUpload} disabled={uploading}>
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="max-w-md mx-auto mt-6 shadow-lg rounded-lg overflow-hidden">
        <CardHeader>
          <CardTitle>Invite a Friend</CardTitle>
          <p className="text-sm text-gray-600">Get bonus credits by inviting a friend to join!</p>
        </CardHeader>
        <CardContent>
          <Input
            type="email"
            placeholder="Enter your friend's email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-4"
          />
          <Button
            onClick={handleSendInvitation}
            disabled={isSending || !email}
            className="w-full bg-red-600 text-white hover:bg-red-700 transition duration-300"
          >
            {isSending ? "Sending..." : "Send Invitation"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
