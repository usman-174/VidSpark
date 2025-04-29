import axios from "./axiosInstance";
import { Policy, PolicyType } from "@/types/policyTypes"; // 👈 custom types

export const policyAPI = {
  getAll: (): Promise<Policy[]> =>
    axios.get("/policies").then(res => res.data),

  create: (credits: number, type: PolicyType): Promise<Policy> =>
    axios.post("/policies", { credits, type }).then(res => res.data),

  updateCredits: (id: string, credits: number): Promise<Policy> =>
    axios.put(`/policies/${id}`, { credits }).then(res => res.data),
};
