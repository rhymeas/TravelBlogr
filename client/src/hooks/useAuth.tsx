import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
  user?: any; // OIDC user data if available
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "tour-logged-in";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [localStorageAuth, setLocalStorageAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check for OIDC authentication via /api/auth/user
  const { data: oidcUser, isLoading: oidcLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Check localStorage on mount
  useEffect(() => {
    const loggedIn = localStorage.getItem(STORAGE_KEY) === "true";
    setLocalStorageAuth(loggedIn);
    setIsLoading(false);
  }, []);

  // Determine authentication status: either localStorage OR OIDC
  const isAuthenticated = localStorageAuth || !!oidcUser;
  const overallLoading = isLoading || oidcLoading;

  const login = async (password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      const response: any = await apiRequest("POST", "/api/simple-login", { 
        password
      });

      if (response.success) {
        // Set localStorage and update state
        localStorage.setItem(STORAGE_KEY, "true");
        setLocalStorageAuth(true);
        
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
    setLocalStorageAuth(false);
    
    // If OIDC user exists, redirect to OIDC logout
    if (oidcUser) {
      window.location.href = "/api/logout";
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    login,
    logout,
    isLoading: overallLoading,
    user: oidcUser, // Expose OIDC user data if available
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