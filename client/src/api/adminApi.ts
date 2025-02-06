// src/api/adminApi.ts
import axios from "./axiosInstance";
import { AdminStats, CreditStats, DomainStats, InvitationStats, UserGrowthData } from "@/types/adminTypes";



export const adminAPI = {
  getStats: () => axios.get<AdminStats>("/admin/stats").then(res => res.data),
  getInvitations: () => axios.get<InvitationStats>("/admin/invitations").then(res => res.data),
  getCredits: () => axios.get<CreditStats>("/admin/credits").then(res => res.data),
  getUserGrowth: () => axios.get<UserGrowthData>("/admin/user-growth").then(res => res.data),
  getUserDomains: () => axios.get<DomainStats>("/admin/user-domains").then(res => res.data),
};