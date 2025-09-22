import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { TourSettings } from "@shared/schema";

export default function DocumentTitle() {
  // Fetch tour settings to get the current tour name
  const { data: tourSettings } = useQuery<TourSettings>({
    queryKey: ["/api/tour-settings"],
  });

  // Update document title when tour settings change
  useEffect(() => {
    if (tourSettings?.tourName) {
      document.title = `${tourSettings.tourName} - Ihr persönlicher Reiseführer`;
    } else {
      document.title = `Kanada Tour - Ihr persönlicher Reiseführer`;
    }
  }, [tourSettings?.tourName]);

  // This component doesn't render anything
  return null;
}