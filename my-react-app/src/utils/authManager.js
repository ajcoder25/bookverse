// A simple event emitter for auth state changes
const authListeners = new Set();

export const authManager = {
  // Subscribe to auth state changes
  subscribe: (listener) => {
    authListeners.add(listener);
    return () => authListeners.delete(listener);
  },

  // Notify all listeners of auth state change
  notifyAuthChange: () => {
    const isLoggedIn = !!localStorage.getItem("userToken");
    authListeners.forEach((listener) => listener(isLoggedIn));
  },

  // Login helper
  setLoginData: (token, userData) => {
    localStorage.setItem("userToken", token);
    localStorage.setItem("user", JSON.stringify(userData));
    authManager.notifyAuthChange();
  },

  // Logout helper
  logout: () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("user");
    authManager.notifyAuthChange();
  },
};
