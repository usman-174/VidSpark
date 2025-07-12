import React, { useState, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  UserPlus,
  Clock,
  Search,
  RefreshCw,
  Check,
  X,
  Mail,
  SortAsc,
  SortDesc,
  AlertTriangle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import useAuthStore, { User } from "@/store/authStore";
import { ProfileCard } from "@/components/profle/ProfileCard";
import { 
  useInvitations, 
  useSendInvitation, 
  useRefreshInvitations 
} from "@/hooks/useInvitations";
import { Invitation } from "@/api/invitationsApi";

interface SortOption {
  value: keyof Invitation;
  label: string;
}

const Profile = () => {
  const { user } = useAuthStore() as { user: User | null };
  
  // Form state
  const [email, setEmail] = useState("");
  
  // Filter and sort states
  const [filterText, setFilterText] = useState("");
  const [sortField, setSortField] = useState<keyof Invitation>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // React Query hooks
  const { 
    data: invitations = [], 
    isLoading: isLoadingInvitations, 
    error: invitationsError,
    isRefetching 
  } = useInvitations(user?.id);
  
  const sendInvitationMutation = useSendInvitation();
  const { refresh } = useRefreshInvitations();

  // Local error state for invitation form
  const [invitationError, setInvitationError] = useState<string | null>(null);

  // Sort options
  const sortOptions: SortOption[] = [
    { value: "createdAt", label: "Date Created" },
    { value: "expiresAt", label: "Expiration Date" },
    { value: "inviteeEmail", label: "Email" },
    { value: "isUsed", label: "Status" },
  ];

  // Email validation
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const handleInvitation = async () => {
    // Clear any previous errors
    setInvitationError(null);

    if (!email.trim()) {
      setInvitationError("Please enter an email address");
      return;
    }

    if (!isValidEmail(email)) {
      setInvitationError("Please enter a valid email address");
      return;
    }

    if (!user?.id) {
      setInvitationError("User not authenticated");
      return;
    }

    try {
      await sendInvitationMutation.mutateAsync({
        inviterId: user.id,
        inviteeEmail: email.trim(),
      });
      setEmail(""); // Clear form on success
      setInvitationError(null); // Clear any errors
    } catch (error: any) {
      // Set local error for display above input
      const errorMessage = error.response?.data?.error || 
                          error.message || 
                          "Failed to send invitation";
      setInvitationError(errorMessage);
    }
  };

  // Utility functions
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isExpired = (expiryDate: string): boolean => {
    return new Date(expiryDate) < new Date();
  };

  const getTimeRemaining = (expiryDate: string): string => {
    const now = new Date();
    const expiry = new Date(expiryDate);

    if (now > expiry) return "";

    const diffMs = expiry.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? "s" : ""} remaining`;
    } else {
      const hours = Math.floor(diffMins / 60);
      return `${hours} hour${hours !== 1 ? "s" : ""} remaining`;
    }
  };

  // Processed invitations with filtering and sorting
  const processedInvitations = useMemo(() => {
    let list = [...invitations];

    // Filter by email
    if (filterText.trim()) {
      list = list.filter((invite) =>
        invite.inviteeEmail.toLowerCase().includes(filterText.toLowerCase())
      );
    }

    // Sort by selected field
    list.sort((a, b) => {
      if (sortField === "isUsed") {
        return sortOrder === "asc"
          ? a.isUsed === b.isUsed ? 0 : a.isUsed ? 1 : -1
          : a.isUsed === b.isUsed ? 0 : a.isUsed ? -1 : 1;
      }

      let compareA = a[sortField] as any;
      let compareB = b[sortField] as any;

      if (sortField === "createdAt" || sortField === "expiresAt") {
        compareA = new Date(compareA).getTime();
        compareB = new Date(compareB).getTime();
      }

      if (compareA < compareB) return sortOrder === "asc" ? -1 : 1;
      if (compareA > compareB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [invitations, filterText, sortField, sortOrder]);

  // Statistics
  const stats = useMemo(() => {
    const total = invitations.length;
    const accepted = invitations.filter(inv => inv.isUsed).length;
    const pending = invitations.filter(inv => !inv.isUsed && !isExpired(inv.expiresAt)).length;
    
    return { total, accepted, pending };
  }, [invitations]);

  // Invitation status component
  const InvitationStatus = ({ isUsed, expiresAt }: { isUsed: boolean; expiresAt: string }) => {
    if (isUsed) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-300 hover:bg-green-100">
          <Check className="w-3 h-3 mr-1" />
          Accepted
        </Badge>
      );
    }

    if (isExpired(expiresAt)) {
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300">
          <X className="w-3 h-3 mr-1" />
          Expired
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-300">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      {/* Profile Card */}
      <ProfileCard user={user!} />

      <div className="grid md:grid-cols-2 gap-6 items-start">
        {/* Invite Friend Section */}
        <Card className="shadow-lg border-l-4 ">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-lg">
              <UserPlus className="w-5 h-5 mr-2 text-blue-600" />
              Invite a Friend
            </CardTitle>
            <CardDescription className="text-gray-600">
              Send an invitation to join the platform and earn rewards
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Error Alert - positioned above input */}
            {invitationError && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-red-800">
                  {invitationError}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Input
                type="email"
                placeholder="friend@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  // Clear error when user starts typing
                  if (invitationError) {
                    setInvitationError(null);
                  }
                }}
                className={`transition-colors ${
                  invitationError ? "border-red-500 focus:border-red-500" : 
                  email && isValidEmail(email) ? "border-green-500" : ""
                }`}
              />
              {email && isValidEmail(email) && !invitationError && (
                <div className="flex items-center text-sm text-green-600">
                  <Check className="w-4 h-4 mr-1" />
                  Valid email address
                </div>
              )}
            </div>
            
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
              onClick={handleInvitation}
              disabled={
                sendInvitationMutation.isPending || 
                !email.trim() || 
                !isValidEmail(email)
              }
            >
              {sendInvitationMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending Invitation...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Invited Users Section */}
        <Card className="shadow-lg border-l-4 ">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center text-lg">
                  <Mail className="w-5 h-5 mr-2 text-green-600" />
                  Invited Users
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Track your sent invitations and their status
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={refresh}
                disabled={isRefetching}
                title="Refresh invitations"
                className="hover:bg-green-50"
              >
                <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Error state */}
            {invitationsError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load invitations. Please try again.
                </AlertDescription>
              </Alert>
            )}

            {/* Loading state */}
            {isLoadingInvitations ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading invitations...</span>
              </div>
            ) : (
              <>
                {/* Filter and sort controls */}
                {invitations.length > 0 && (
                  <div className="space-y-3">
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
                        {sortOrder === "asc" ? (
                          <SortAsc className="h-4 w-4" />
                        ) : (
                          <SortDesc className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Stats summary */}
                {invitations.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg text-center border ">
                      <div className="text-xl font-bold text-blue-700">{stats.total}</div>
                      <div className="text-xs text-blue-600 font-medium">Total</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg text-center border ">
                      <div className="text-xl font-bold text-green-700">{stats.accepted}</div>
                      <div className="text-xs text-green-600 font-medium">Accepted</div>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-3 rounded-lg text-center border ">
                      <div className="text-xl font-bold text-amber-700">{stats.pending}</div>
                      <div className="text-xs text-amber-600 font-medium">Pending</div>
                    </div>
                  </div>
                )}

                {/* Invitation list */}
                {processedInvitations.length === 0 ? (
                  <div className="text-center py-8">
                    <Mail className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">
                      {filterText
                        ? "No matching invitations found"
                        : invitations.length === 0
                        ? "No invitations sent yet"
                        : "No matching invitations"}
                    </p>
                    {invitations.length === 0 && (
                      <p className="text-sm text-gray-400 mt-1">
                        Start by inviting your first friend!
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {processedInvitations.map((invite) => (
                      <div
                        key={invite.id}
                        className="p-4 bg-white border border-gray-200 hover:border-gray-300 rounded-lg transition-all duration-200 hover:shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                              <Mail className="w-4 h-4 text-gray-500" />
                            </div>
                            <span className="font-medium text-gray-900">{invite.inviteeEmail}</span>
                          </div>
                          <InvitationStatus
                            isUsed={invite.isUsed}
                            expiresAt={invite.expiresAt}
                          />
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-500 ml-11">
                          <span>Sent: {formatDate(invite.createdAt)}</span>
                          {!invite.isUsed && !isExpired(invite.expiresAt) && (
                            <span className="font-medium text-amber-600">
                              {getTimeRemaining(invite.expiresAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
          
          {processedInvitations.length > 0 && (
            <CardFooter className="pt-0">
              <div className="text-xs text-gray-500">
                Showing {processedInvitations.length} of {invitations.length} invitations
              </div>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Profile;