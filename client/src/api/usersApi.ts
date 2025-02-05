import axios from "./axiosInstance";



export interface UserFormData {

  role: "USER" | "ADMIN";
 
}

export const usersAPI = {
  getUsers: () => axios.get("/users").then((res) => res.data),
  updateUser: ({ id, data }: { id: string; data: UserFormData }) =>
    axios.put(`/users/${id}`, data).then((res) => res.data),
  deleteUser: (id: string) =>
    axios.delete(`/users/${id}`).then((res) => res.data),
};
