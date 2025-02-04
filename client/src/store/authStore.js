// src/store/authStore.ts
import { create } from "zustand";
import axios from "@/api/axiosInstance";
const useAuthStore = create((set) => ({
    isAuthenticated: false,
    user: null,
    isLoading: true,
    login: (token, userData) => {
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
        }
        catch (error) {
            set({ isAuthenticated: false, user: null, isLoading: false });
        }
    },
}));
export default useAuthStore;
