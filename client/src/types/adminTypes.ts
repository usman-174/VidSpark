export interface AdminStats {
  totalUsers: number;
  activeAdminUsers: number;
  newUsersToday: number;
  usersWithChildren: number;
  userGrowthRate: number;
}

export interface UserGrowthData {
  dailyGrowth: Array<{ date: string; count: number }>;
  trends: {
    total: number;
    averageDaily: number;
    usersInFamilyStructure: number;
  };
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

export interface FeatureUsageStats {
  success: boolean;
  usage: {
    keyword_analysis: number;
    title_generation: number;
    sentiment_analysis: number;
  };
}

// ✅ New Interface for Date-Range Usage
export interface FeatureUsageByRangeResponse {
  success: boolean;
  usage: Array<{
    feature: string;
    count: number;
  }>;
  topFeature: string | null;
}
