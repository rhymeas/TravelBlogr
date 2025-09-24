import Header from "@/components/Header";
import GlobalTripFeed from "@/components/GlobalTripFeed";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, SortAsc } from "lucide-react";
import type { Location } from "@shared/schema";

export default function LiveFeedPage() {
  const { t } = useLanguage();

  // Get URL parameters for deep linking
  const urlParams = new URLSearchParams(window.location.search);
  const filterLocationId = urlParams.get('locationId');

  // Filter and sort state
  const [selectedLocationFilter, setSelectedLocationFilter] = useState<string>(filterLocationId || 'all');
  const [sortOption, setSortOption] = useState<string>(urlParams.get('sortBy') || 'newest');

  // Fetch locations for the filter dropdown
  const { data: locations = [] } = useQuery<Location[]>({ queryKey: ['/api/locations'] });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" data-testid="live-feed-page">
      <Header />
      
      {/* Page Title with Filter and Sort Controls */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground" data-testid="live-feed-title">{t('liveFeed')}</h1>
              <p className="text-muted-foreground mt-1">Teile deine Reisemomente</p>
            </div>
            
            {/* Filter and Sort Controls */}
            <div className="flex items-center gap-3" data-testid="filter-sort-controls">
              {/* Location Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={selectedLocationFilter} onValueChange={setSelectedLocationFilter}>
                  <SelectTrigger className="w-40 h-8 text-sm" data-testid="location-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Orte</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Options */}
              <div className="flex items-center gap-2">
                <SortAsc className="w-4 h-4 text-muted-foreground" />
                <Select value={sortOption} onValueChange={setSortOption}>
                  <SelectTrigger className="w-36 h-8 text-sm" data-testid="sort-option">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Neueste zuerst</SelectItem>
                    <SelectItem value="oldest">Älteste zuerst</SelectItem>
                    <SelectItem value="most-liked">Meist gelikt</SelectItem>
                    <SelectItem value="photo-date">Nach Fotodatum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <GlobalTripFeed 
          selectedLocationFilter={selectedLocationFilter}
          sortOption={sortOption}
        />
      </div>
    </div>
  );
}