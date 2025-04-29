export type PolicyType = "BASIC" | "PREMIUM" | "ADVANCED";

export interface Policy {
  id: string;
  credits: number;
  type: PolicyType;
  createdAt: string; // Or Date if you parse it
  updatedAt: string; // Or Date if you parse it
}
