export interface AdminStats {
  totalUsers: number;
  activeAdminUsers: number;
  newUsersToday: number;
  usersWithChildren: number;
  userGrowthRate: number;
}

export interface InvitationStats {
  totalInvitations: number;
  usedInvitations: number;
  pendingInvitations: number;
  conversionRate: number;
  topInviters: {
    email: string;
    invitationsSent: number;
  }[];
}

export interface CreditStats {
  totalCreditsGiven: number;
  creditsByPolicyType: {
    type: string;
    credits: number;
  }[];
  policyStats: {
    type: string;
    userCount: number;
  }[];
}


export interface DomainStats {
  domains: Array<{
    domain: string;
    count: number;
    percentage: number;
  }>;
  stats: {
    totalDomains: number;
    topDomainsUsers: number;
    otherUsersCount: number;
  };
}
  export interface UserDomainStats {
    domain: string;
    count: number;
  }
  