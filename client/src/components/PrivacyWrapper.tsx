import { useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Wine } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import PrivacyLoginPage from "@/components/PrivacyLoginPage";

interface PrivacyWrapperProps {
  children: ReactNode;
}

interface PrivacyStatusResponse {
  privacyEnabled: boolean;
}

export default function PrivacyWrapper({ children }: PrivacyWrapperProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [shouldShowLogin, setShouldShowLogin] = useState(false);

  // Query privacy status from server
  const {
    data: privacyStatus,
    isLoading: statusLoading,
    error: statusError
  } = useQuery<PrivacyStatusResponse>({
    queryKey: ["/api/privacy-status"],
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    retry: 2,
  });

  // Determine what to show based on privacy settings and auth status
  useEffect(() => {
    if (statusLoading || authLoading) return;

    // If there's an error fetching privacy status, default to showing the app
    if (statusError) {
      console.warn("Failed to fetch privacy status, defaulting to public access:", statusError);
      setShouldShowLogin(false);
      return;
    }

    // If privacy is disabled, show the app directly
    if (!privacyStatus?.privacyEnabled) {
      setShouldShowLogin(false);
      return;
    }

    // If privacy is enabled, show login if not authenticated
    setShouldShowLogin(!isAuthenticated);
  }, [privacyStatus, isAuthenticated, statusLoading, authLoading, statusError]);

  // Show loading state while checking privacy status or auth
  if (statusLoading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-amber-100 dark:bg-amber-900 p-3 rounded-full">
              <Wine className="w-8 h-8 text-amber-600 dark:text-amber-400 animate-pulse" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Kanada Tour 2025
          </h1>
          <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-300">
            <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
            <span>Wird geladen...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show login page if privacy is enabled and user is not authenticated
  if (shouldShowLogin) {
    return <PrivacyLoginPage />;
  }

  // Show the main app
  return <>{children}</>;
}