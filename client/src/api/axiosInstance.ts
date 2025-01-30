import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.API||"http://localhost:4000/api", // Replace with your API base URL
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    // Add token if needed
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle errors globally
    if (error.response?.status === 401) {
      // For example: logout user
      console.error("Unauthorized");
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
