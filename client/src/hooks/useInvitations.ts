// src/hooks/useInvitations.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invitationsAPI, SendInvitationRequest } from '@/api/invitationsApi';
import toast from 'react-hot-toast';

// Query keys
export const invitationQueryKeys = {
  all: ['invitations'] as const,
  list: () => [...invitationQueryKeys.all, 'list'] as const,
} as const;

// Hook for fetching invitations
export const useInvitations = (userId: string | undefined) => {
  return useQuery({
    queryKey: invitationQueryKeys.list(),
    queryFn: invitationsAPI.getInvitations,
    enabled: !!userId, // Only fetch when user ID exists
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};

// Hook for sending invitations
export const useSendInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: SendInvitationRequest) => 
      invitationsAPI.sendInvitation(request),
    onSuccess: (data) => {
      // Invalidate and refetch invitations
      queryClient.invalidateQueries({ queryKey: invitationQueryKeys.list() });
      
      toast.success(data.message || "Invitation sent successfully!");
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error || "Failed to send invitation";
      toast.error(errorMessage);
    },
  });
};

// Hook for manual refresh
export const useRefreshInvitations = () => {
  const queryClient = useQueryClient();

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: invitationQueryKeys.list() });
  };

  return { refresh };
};