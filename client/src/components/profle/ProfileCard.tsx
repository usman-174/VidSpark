import React, { useRef, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Calendar,
  CreditCard,
  User as UserIcon,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { User } from "@/store/authStore";
import axiosInstance from "@/api/axiosInstance";
import useAuthStore from "@/store/authStore";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface ProfileCardProps {
  user: User;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ user }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = useState<string | null>(user?.profileImage || null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Format the member since date
  const memberSince = user?.createdAt
    ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })
    : null;

  // Get the avatar fallback text (initials)
  const getInitials = () => {
    if (user?.name) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || "U";
  };
  
  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }
      setFile(selectedFile);
      setIsDialogOpen(true);
    }
  };

  // Handle image upload
  const handleImageUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axiosInstance.post(
        "/uploads/profile-image",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const progress =
              (progressEvent.loaded / (progressEvent.total || 0)) * 100;
            setUploadProgress(Math.round(progress));
          },
        }
      );

      setProfileImage(response.data.imageUrl);
      setFile(null);
      setIsDialogOpen(false);
      toast.success("Profile picture updated successfully!");
      
      // Refresh user data in the global store
      useAuthStore.getState().refreshUser();
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Cancel upload and close dialog
  const cancelUpload = () => {
    setFile(null);
    setIsDialogOpen(false);
  };

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="relative group">
              <Avatar className={`h-20 w-20 cursor-pointer border-2 ${isUploading ? 'opacity-75' : ''} border-gray-100`}>
                <AvatarImage
                  src={profileImage || "/default-avatar.png"}
                  alt={user?.name || user?.email}
                />
                <AvatarFallback className="text-lg bg-primary/10 text-primary">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              
              {/* Upload Progress Indicator */}
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-16 h-16">
                    {/* Circular progress background */}
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle 
                        className="text-gray-200" 
                        strokeWidth="8"
                        stroke="currentColor" 
                        fill="transparent" 
                        r="42" 
                        cx="50" 
                        cy="50" 
                      />
                      <circle 
                        className="text-primary" 
                        strokeWidth="8"
                        strokeDasharray={264}
                        strokeDashoffset={264 - (uploadProgress / 100) * 264}
                        strokeLinecap="round" 
                        stroke="currentColor" 
                        fill="transparent" 
                        r="42" 
                        cx="50" 
                        cy="50" 
                      />
                    </svg>
                    {/* Percentage text */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-semibold text-white">
                        {Math.round(uploadProgress)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Upload button overlay - only visible when not uploading */}
              {!isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <label
                    className="cursor-pointer p-2"
                    aria-label="Upload profile image"
                    title="Upload image (max 5MB)"
                  >
                    <Upload className="h-6 w-6 text-white" />
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileSelect}
                      ref={fileInputRef}
                      disabled={isUploading}
                    />
                  </label>
                </div>
              )}
            </div>
            <div>
              <CardTitle className="text-2xl">
                {user?.name}
                <span className="text-lg mx-3 text-muted-foreground">
                  {user?.email}
                </span>
              </CardTitle>
              <CardDescription className="flex flex-wrap gap-2 mt-1">
                <Badge variant={user?.role === "ADMIN" ? "default" : "outline"}>
                  {user?.role}
                </Badge>

                {user?.gender && (
                  <Badge variant="secondary" className="font-normal">
                    {user.gender.charAt(0) + user.gender.slice(1).toLowerCase()}
                  </Badge>
                )}
              </CardDescription>

              {memberSince && (
                <div className="flex items-center mt-1 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 mr-1" />
                  Member {memberSince}
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Additional Info Section */}
        {(user?.creditBalance !== undefined || user?.parentId) && (
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-4">
              {user?.creditBalance !== undefined && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <CreditCard className="w-4 h-4 mr-1" />
                  <span>
                    Credits: {user.creditBalance}
                    {user?.totalCredits !== undefined &&
                      ` / ${user.totalCredits}`}
                  </span>
                </div>
              )}

              {user?.parentId && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <UserIcon className="w-4 h-4 mr-1" />
                  <span>Sub-account</span>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Upload Image Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Profile Picture</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {file && (
              <div className="relative flex items-center justify-center rounded-lg overflow-hidden border h-64">
                <img
                  src={URL.createObjectURL(file)}
                  alt="Preview"
                  className="max-h-full object-contain"
                />
              </div>
            )}
            <div className="space-y-2">
              <Progress value={uploadProgress} className="h-2 w-full" />
              <p className="text-sm text-muted-foreground text-center">
                {isUploading
                  ? `Uploading: ${uploadProgress}%`
                  : "Ready to upload"}
              </p>
            </div>
          </div>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={cancelUpload}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleImageUpload}
              disabled={isUploading || !file}
            >
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};