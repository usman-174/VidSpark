import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import axiosInstance from '@/api/axiosInstance';
import useAuthStore from '@/store/authStore';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
const Profile = () => {
    const { user } = useAuthStore();
    const [email, setEmail] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
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
        }
        catch (error) {
            const errorMsg = error.message || error.response?.data?.error || 'Error sending invitation. Please try again later.';
            setErrorMessage(errorMsg);
        }
        finally {
            setIsSending(false);
        }
    };
    return (_jsxs("div", { className: "container mx-auto p-4", children: [_jsx(Card, { className: "max-w-md mx-auto shadow-lg rounded-lg overflow-hidden", children: _jsx(CardHeader, { children: _jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs(Avatar, { children: [_jsx(AvatarImage, { src: user?.profileImage || '/default-avatar.png', alt: "Profile Image" }), _jsx(AvatarFallback, { children: user?.email?.charAt(0).toUpperCase() })] }), _jsxs("div", { children: [_jsx(CardTitle, { className: "text-lg font-semibold", children: user?.email }), _jsxs("p", { className: "text-sm text-gray-500", children: ["Role: ", user?.role] })] })] }) }) }), _jsxs(Card, { className: "max-w-md mx-auto mt-6 shadow-lg rounded-lg overflow-hidden", children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Invite a Friend" }), _jsx("p", { className: "text-sm text-gray-600", children: "Get bonus credits by inviting a friend to join!" })] }), _jsxs(CardContent, { children: [_jsx(Input, { type: "email", placeholder: "Enter your friend's email", value: email, onChange: (e) => setEmail(e.target.value), className: "mb-4" }), _jsx(Button, { onClick: handleSendInvitation, disabled: isSending || !email, className: "w-full", variant: isSending || !email ? "secondary" : "default", children: isSending ? 'Sending Invitation...' : 'Send Invitation' }), errorMessage && _jsx("p", { className: "text-red-500 mt-4", children: errorMessage }), successMessage && _jsx("p", { className: "text-green-500 mt-4", children: successMessage })] })] })] }));
};
export default Profile;
