import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "tour-logged-in";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check localStorage on mount
  useEffect(() => {
    const loggedIn = localStorage.getItem(STORAGE_KEY) === "true";
    setIsAuthenticated(loggedIn);
    setIsLoading(false);
  }, []);

  const login = async (password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      const response: any = await apiRequest("POST", "/api/simple-login", { 
        password
      });

      if (response.success) {
        // Set localStorage and update state
        localStorage.setItem(STORAGE_KEY, "true");
        setIsAuthenticated(true);
        
        return { success: true };
      } else {
        return { success: false, error: response.message || "Login fehlgeschlagen" };
      }
    } catch (error: any) {
      console.error("Login error:", error);
      
      // Extract error message from API response
      const errorMessage = error.message || "Unbekannter Fehler beim Login";
      
      return { 
        success: false, 
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setIsAuthenticated(false);
  };

  const value: AuthContextType = {
    isAuthenticated,
    login,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}