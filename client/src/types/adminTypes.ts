export interface UserStats {
    totalUsers: number;
    activeUsers: number;
    newUsersToday: number;
  }
  
  export interface InvitationStats {
    totalInvitations: number;
    usedInvitations: number;
    pendingInvitations: number;
  }
  
  export interface CreditStats {
    totalCreditsGiven: number;
    policyStats: { type: string; credits: number }[];
  }
  
  export interface UserGrowthData {
    date: string;
    count: number;
  }
  
  export interface UserDomainStats {
    domain: string;
    count: number;
  }