import axios from "./axiosInstance";

export interface Package {
  id: string;
  name: string;
  credits: number;
  price: number;
}

export interface PackageFormData {
  name: string;
  credits: number;
  price: number;
}

// API functions
export const packagesAPI = {
  getPackages: () => axios.get("/packages").then((res) => res.data),
  createPackage: (data: PackageFormData) =>
    axios.post("/packages", data).then((res) => res.data),
  updatePackage: ({ id, data }: { id: string; data: PackageFormData }) =>
    axios.put(`/packages/${id}`, data).then((res) => res.data),
  deletePackage: (id: string) =>
    axios.delete(`/packages/${id}`).then((res) => res.data),
};
