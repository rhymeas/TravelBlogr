// Simple hardcoded city lookup for Canadian tour locations
// Approximate coordinate boundaries for each city in the tour

interface CityBounds {
  name: string;
  nameEn: string;
  province: string;
  northLat: number;
  southLat: number;
  eastLng: number;
  westLng: number;
}

// Hardcoded Canadian tour cities with approximate coordinate boundaries
const CANADIAN_CITIES: CityBounds[] = [
  {
    name: "Penticton",
    nameEn: "Penticton", 
    province: "BC",
    northLat: 49.57,
    southLat: 49.43,
    eastLng: -119.45,
    westLng: -119.67
  },
  {
    name: "Vernon",
    nameEn: "Vernon",
    province: "BC", 
    northLat: 50.30,
    southLat: 50.20,
    eastLng: -119.20,
    westLng: -119.40
  },
  {
    name: "Golden",
    nameEn: "Golden",
    province: "BC",
    northLat: 51.35,
    southLat: 51.25,
    eastLng: -116.90,
    westLng: -117.10
  },
  {
    name: "Jasper",
    nameEn: "Jasper", 
    province: "AB",
    northLat: 52.95,
    southLat: 52.85,
    eastLng: -117.95,
    westLng: -118.15
  },
  {
    name: "Clearwater",
    nameEn: "Clearwater",
    province: "BC",
    northLat: 51.70,
    southLat: 51.60,
    eastLng: -120.00,
    westLng: -120.20
  },
  {
    name: "Lillooet",
    nameEn: "Lillooet",
    province: "BC", 
    northLat: 50.70,
    southLat: 50.60,
    eastLng: -121.90,
    westLng: -122.10
  },
  {
    name: "Sunshine Coast",
    nameEn: "Sunshine Coast",
    province: "BC",
    northLat: 49.75,
    southLat: 49.35,
    eastLng: -123.50,
    westLng: -124.10
  }
];

/**
 * Simple city lookup based on GPS coordinates
 * Returns the nearest Canadian tour city name or a generic location
 */
export function getCityFromCoordinates(lat: number, lng: number, useEnglish: boolean = false): string {
  // Check if coordinates are within any city bounds
  for (const city of CANADIAN_CITIES) {
    if (lat >= city.southLat && lat <= city.northLat && 
        lng >= city.westLng && lng <= city.eastLng) {
      const cityName = useEnglish ? city.nameEn : city.name;
      return `${cityName}, ${city.province}`;
    }
  }
  
  // Calculate distances to find nearest city if not within bounds
  let nearestCity = CANADIAN_CITIES[0];
  let shortestDistance = Number.MAX_VALUE;
  
  for (const city of CANADIAN_CITIES) {
    // Use center point of city bounds
    const cityLat = (city.northLat + city.southLat) / 2;
    const cityLng = (city.eastLng + city.westLng) / 2;
    
    // Simple distance calculation (Haversine formula)
    const distance = calculateDistance(lat, lng, cityLat, cityLng);
    
    if (distance < shortestDistance) {
      shortestDistance = distance;
      nearestCity = city;
    }
  }
  
  // If within 150km of a tour city, show "Near [City]"
  if (shortestDistance <= 150) {
    const cityName = useEnglish ? nearestCity.nameEn : nearestCity.name;
    const nearText = useEnglish ? "Near" : "Nähe";
    return `${nearText} ${cityName}, ${nearestCity.province}`;
  }
  
  // Otherwise show generic Canadian region based on coordinates
  return getGenericRegion(lat, lng, useEnglish);
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get generic Canadian region based on coordinates
 */
function getGenericRegion(lat: number, lng: number, useEnglish: boolean): string {
  // British Columbia (roughly)
  if (lng >= -140 && lng <= -114 && lat >= 48 && lat <= 60) {
    return useEnglish ? "British Columbia, Canada" : "British Columbia, Kanada";
  }
  
  // Alberta (roughly)  
  if (lng >= -120 && lng <= -110 && lat >= 49 && lat <= 60) {
    return useEnglish ? "Alberta, Canada" : "Alberta, Kanada";
  }
  
  // Generic Canada
  return useEnglish ? "Canada" : "Kanada";
}

/**
 * Format current time in German or English format
 */
export function getCurrentTimeFormatted(useEnglish: boolean = false): string {
  const now = new Date();
  
  if (useEnglish) {
    return now.toLocaleTimeString('en-CA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } else {
    return now.toLocaleTimeString('de-DE', {
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
  }
}

/**
 * Get location status text with city and time
 */
export function getLocationStatus(lat: number, lng: number, useEnglish: boolean = false): string {
  const cityText = getCityFromCoordinates(lat, lng, useEnglish);
  const timeText = getCurrentTimeFormatted(useEnglish);
  const currentlyText = useEnglish ? "Currently" : "Aktuell";
  
  return `${currentlyText}: ${cityText} • ${timeText}`;
}