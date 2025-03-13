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
import { Badge } from "@/components/ui/badge";
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
import useAuthStore, { User } from "@/store/authStore";
import { ProfileCard } from "@/components/profle/ProfileCard";

// Type definitions
interface Invitation {
  id: string;
  inviterId: string;
  inviteeEmail: string;
  inviteLink?: string | null;
  isUsed: boolean;
  expiresAt: string;
  createdAt: string;
}

interface SortOption {
  value: keyof Invitation;
  label: string;
}

const Profile = () => {
  const { user } = useAuthStore() as { user: User | null };
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [invitedUsers, setInvitedUsers] = useState<Invitation[]>([]);
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
      const response = await axiosInstance.get<Invitation[]>(
        "/invitations/get-invitations"
      );
      setInvitedUsers(response.data);
    } catch (error) {
      toast.error("Failed to fetch invited users");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleInvitation = async () => {
    if (!email.trim()) {
      toast.error("Please enter a valid email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error("Please enter a valid email format");
      return;
    }

    setIsLoading(true);

    try {
      await axiosInstance.post("/invitations/send-invitation", {
        inviterId: user?.id,
        inviteeEmail: email,
      });

      toast.success("Invitation sent successfully!");
      setEmail("");
      fetchInvitedUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to send invitation");
    } finally {
      setIsLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
      return `${diffMins} minute${diffMins !== 1 ? "s" : ""} remaining`;
    } else {
      const hours = Math.floor(diffMins / 60);
      return `${hours} hour${hours !== 1 ? "s" : ""} remaining`;
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
    list.sort((a: any, b: any) => {
      // Special handling for boolean isUsed field
      if (sortField === "isUsed") {
        return sortOrder === "asc"
          ? a.isUsed === b.isUsed
            ? 0
            : a.isUsed
            ? 1
            : -1
          : a.isUsed === b.isUsed
          ? 0
          : a.isUsed
          ? -1
          : 1;
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
    expiresAt,
  }: {
    isUsed: boolean;
    expiresAt: string;
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
      {/* Profile Card - Now with self-contained image upload functionality */}
      <ProfileCard user={user!} />

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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button
                className="w-full"
                onClick={handleInvitation}
                disabled={isLoading || !email}
              >
                {isLoading ? (
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
                <CardDescription>Track your sent invitations</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={fetchInvitedUsers}
                disabled={isRefreshing}
                title="Refresh invitations"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
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
                  onValueChange={(value) =>
                    setSortField(value as keyof Invitation)
                  }
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
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                  title={
                    sortOrder === "asc" ? "Sort descending" : "Sort ascending"
                  }
                >
                  {sortOrder === "asc" ? (
                    <SortAsc className="h-4 w-4" />
                  ) : (
                    <SortDesc className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Stats summary */}
            {invitedUsers.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-gray-50 p-2 rounded-lg text-center">
                  <div className="text-lg font-semibold">
                    {invitedUsers.length}
                  </div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
                <div className="bg-gray-50 p-2 rounded-lg text-center">
                  <div className="text-lg font-semibold">
                    {invitedUsers.filter((invite) => invite.isUsed).length}
                  </div>
                  <div className="text-xs text-gray-500">Accepted</div>
                </div>
                <div className="bg-gray-50 p-2 rounded-lg text-center">
                  <div className="text-lg font-semibold">
                    {
                      invitedUsers.filter(
                        (invite) =>
                          !invite.isUsed && !isExpired(invite.expiresAt)
                      ).length
                    }
                  </div>
                  <div className="text-xs text-gray-500">Pending</div>
                </div>
              </div>
            )}

            {/* Invitation list */}
            {processedInvitedUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {filterText
                  ? "No matching invitations found"
                  : "No invitations sent yet"}
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
                        <span className="font-medium">
                          {invite.inviteeEmail}
                        </span>
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
                <>
                  Showing {processedInvitedUsers.length} of{" "}
                  {invitedUsers.length} invitations
                </>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
