// src/api/invitationsApi.ts
import axiosInstance from "./axiosInstance";

// Type definitions
export interface Invitation {
  id: string;
  inviterId: string;
  inviteeEmail: string;
  inviteLink?: string | null;
  isUsed: boolean;
  expiresAt: string;
  createdAt: string;
}

export interface SendInvitationRequest {
  inviterId: string;
  inviteeEmail: string;
}

export interface InvitationsResponse {
  success: boolean;
  data: Invitation[];
  message?: string;
}

export interface SendInvitationResponse {
  success: boolean;
  data: Invitation;
  message: string;
}

// API functions
export const invitationsAPI = {
  // Get all invitations for current user
  getInvitations: (): Promise<Invitation[]> =>
    axiosInstance.get("/invitations/get-invitations").then((res) => res.data),

  // Send new invitation
  sendInvitation: (request: SendInvitationRequest): Promise<SendInvitationResponse> =>
    axiosInstance.post("/invitations/send-invitation", request).then((res) => res.data),

  // Refresh/refetch invitations (same as get but for explicit refresh)
  refreshInvitations: (): Promise<Invitation[]> =>
    axiosInstance.get("/invitations/get-invitations").then((res) => res.data),
};