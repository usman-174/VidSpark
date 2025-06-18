// src/api/adminApi.ts
import axios from "./axiosInstance";
import { AdminStats, CreditStats, DomainStats, InvitationStats, UserGrowthData,FeatureUsageStats, } from "@/types/adminTypes";


export const adminAPI = {
  getStats: () =>
    axios.get<AdminStats>("/admin/stats").then((res) => res.data),

  getInvitations: () =>
    axios.get<InvitationStats>("/admin/invitations").then((res) => res.data),

  getCredits: () =>
    axios.get<CreditStats>("/admin/credits").then((res) => res.data),

  getUserGrowth: () =>
    axios.get<UserGrowthData>("/admin/user-growth").then((res) => res.data),

  getUserDomains: () =>
    axios.get<DomainStats>("/admin/user-domains").then((res) => res.data),

  getFeatureUsage: () =>
    axios.get<FeatureUsageStats>("/admin/feature-usage").then((res) => res.data),

  // ✅ Add this API for usage by date range:
  getFeatureUsageByRange: (range: string = "7d") =>
    axios
      .get<{ success: boolean; usage: { feature: string; count: number }[]; topFeature: string | null }>(
        `/admin/feature-usage-by-range?range=${range}`
      )
      .then((res) => res.data),
};

