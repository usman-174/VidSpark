// src/store/authStore.ts
import { create } from "zustand";
import axios from "@/api/axiosInstance";

type Role = "USER" | "ADMIN";

export interface User {
  id: string;
  email: string;
  role: Role;
  profileImage?: string;
  gender?: string;
  parentId?: string;
  totalCredits?: number;
  createdAt: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  getCurrentUser: () => Promise<void>;
}

const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  isLoading: true,
  login: (token: string, userData: User) => {
    localStorage.setItem("token", token);
    set({ isAuthenticated: true, user: userData, isLoading: false });
  },
  logout: () => {
    localStorage.removeItem("token");
    set({ isAuthenticated: false, user: null, isLoading: false });
  },
  getCurrentUser: async () => {
    try {
      const { data } = await axios.get("/auth/me");
      set({ isAuthenticated: true, user: data, isLoading: false });
    } catch (error) {
      set({ isAuthenticated: false, user: null, isLoading: false });
    }
  },
}));

export default useAuthStore;
