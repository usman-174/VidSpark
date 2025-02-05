import React, { useState } from 'react';
import axiosInstance from '@/api/axiosInstance'; 
import useAuthStore from '@/store/authStore';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Profile: React.FC = () => {
  const { user } = useAuthStore(); 
  const [email, setEmail] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [file, setFile] = useState<File | null>(null); 
  const [uploading, setUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(user?.profileImage || null); 

  const inviterId = user?.id; 

  const handleSendInvitation = async () => {
    if (!inviterId) {
      setErrorMessage('User ID is missing. Please log in.');
      return;
    }

    setIsSending(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await axiosInstance.post('/invitations/send-invitation', {
        inviterId: inviterId,
        inviteeEmail: email,
      });

      setSuccessMessage('Invitation sent successfully!');
      setEmail(''); 
    } catch (error: any) {
      const errorMsg = error.message || error.response?.data?.error || 'Error sending invitation. Please try again later.';
      setErrorMessage(errorMsg);
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
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axiosInstance.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const imageUrl = response.data.imageUrl;
      setUploadedImage(imageUrl); 
      setFile(null); // Clear the file input after upload

      // Optionally, save the image URL to the user's profile in the backend here
      // You can use an API call to update the user's profile picture

    } catch (error) {
      setErrorMessage('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-md mx-auto shadow-lg rounded-lg overflow-hidden">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage src={uploadedImage || '/default-avatar.png'} alt="Profile Image" />
              <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg font-semibold">{user?.email}</CardTitle>
              <p className="text-sm text-gray-500">Role: {user?.role}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button onClick={() => document.getElementById('file-input')?.click()}>
            Change Profile Picture
          </Button>
          <input 
            id="file-input" 
            type="file" 
            onChange={handleFileChange} 
            style={{ display: 'none' }}
            accept="image/*" 
          />
          {file && (
            <div className="mt-2">
              <p>File Selected: {file.name}</p>
              <Button onClick={handleImageUpload} disabled={uploading}>
                {uploading ? 'Uploading...' : 'Upload Image'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

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
            className="w-full"
            variant={isSending || !email ? "secondary" : "default"}
          >
            {isSending ? 'Sending Invitation...' : 'Send Invitation'}
          </Button>
          {errorMessage && <p className="text-red-500 mt-4">{errorMessage}</p>}
          {successMessage && <p className="text-green-500 mt-4">{successMessage}</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
