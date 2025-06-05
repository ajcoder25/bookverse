import axios from "axios";

// Configure axios defaults
axios.defaults.baseURL = "http://localhost:5000/api";

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
