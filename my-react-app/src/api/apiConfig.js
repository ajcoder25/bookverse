import axios from "axios";

// Set the base URL for all API requests
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://bookverse-69wl.onrender.com/api';
axios.defaults.baseURL = API_BASE_URL;

// Add request interceptor for common headers
axios.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem("userToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle unauthorized errors (expired token or invalid token)
    if (error.response?.status === 401) {
      localStorage.removeItem("userToken");
      localStorage.removeItem("user");
      // Dispatch storage event for other components
      window.dispatchEvent(new Event("storage"));
      // Redirect to login if not already there
      if (!window.location.pathname.includes("/auth")) {
        window.location.href = "/auth";
      }
    }
    return Promise.reject(error);
  }
);

export default axios;
