import { createContext, useContext, useState, useCallback } from "react";
import { toast } from "sonner";

const AdminContext = createContext(null);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
};

export const AdminProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credentials, setCredentials] = useState(null);

  const getAuthHeader = useCallback(() => {
    if (!credentials) return {};
    const encoded = btoa(`${credentials.username}:${credentials.password}`);
    return { Authorization: `Basic ${encoded}` };
  }, [credentials]);

  const login = async (username, password) => {
    const encoded = btoa(`${username}:${password}`);
    
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/verify`,
        {
          headers: {
            Authorization: `Basic ${encoded}`,
          },
        }
      );

      if (response.ok) {
        setCredentials({ username, password });
        setIsAuthenticated(true);
        // Store in session only (not localStorage for security)
        sessionStorage.setItem("admin_auth", encoded);
        return true;
      }
      
      if (response.status === 429) {
        toast.error("Too many failed attempts. Please try again later.");
      } else {
        toast.error("Invalid credentials");
      }
      return false;
    } catch (error) {
      toast.error("Authentication failed");
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCredentials(null);
    sessionStorage.removeItem("admin_auth");
  };

  // Check for existing session
  const checkSession = useCallback(async () => {
    const stored = sessionStorage.getItem("admin_auth");
    if (stored) {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/api/admin/verify`,
          {
            headers: { Authorization: `Basic ${stored}` },
          }
        );
        if (response.ok) {
          const [username, password] = atob(stored).split(":");
          setCredentials({ username, password });
          setIsAuthenticated(true);
          return true;
        }
      } catch (e) {
        // Session invalid
      }
      sessionStorage.removeItem("admin_auth");
    }
    return false;
  }, []);

  const value = {
    isAuthenticated,
    login,
    logout,
    checkSession,
    getAuthHeader,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};
