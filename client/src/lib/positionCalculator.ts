import type { Location, LocationPing } from "@shared/schema";

interface CarPosition {
  isVisible: boolean;
  locationIndex: number; // Which location the car is closest to
  progress: number; // 0-1 value showing progress between locations
  isMoving: boolean;
  lastUpdated: Date;
}

interface LocationWithDistance extends Location {
  distanceKm: number;
}

/**
 * Calculate the distance between two GPS coordinates using the Haversine formula
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
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
 * Calculate which location the car is closest to and the progress between locations
 */
export function calculateCarPosition(
  currentPing: LocationPing | null,
  locations: Location[],
  previousPosition?: CarPosition
): CarPosition {
  if (!currentPing || locations.length === 0) {
    return {
      isVisible: false,
      locationIndex: 0,
      progress: 0,
      isMoving: false,
      lastUpdated: new Date(),
    };
  }

  const currentLat = parseFloat(currentPing.latitude);
  const currentLng = parseFloat(currentPing.longitude);

  // Calculate distances to all locations
  const locationsWithDistance: LocationWithDistance[] = locations
    .map((location, index) => {
      if (!location.coordinates) {
        return { ...location, distanceKm: Infinity };
      }
      
      const distance = calculateDistance(
        currentLat,
        currentLng,
        location.coordinates.lat,
        location.coordinates.lng
      );
      
      return { ...location, distanceKm: distance };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const nearestLocation = locationsWithDistance[0];
  const nearestIndex = locations.findIndex(loc => loc.id === nearestLocation.id);

  // Check if we're moving (compare with previous position)
  let isMoving = false;
  if (previousPosition && currentPing.timestamp) {
    const timeDiff = new Date(currentPing.timestamp).getTime() - previousPosition.lastUpdated.getTime();
    const positionChanged = Math.abs(previousPosition.locationIndex - nearestIndex) > 0.1 ||
                           Math.abs(previousPosition.progress - 0.5) > 0.1;
    
    // Consider moving if position changed in the last hour
    isMoving = positionChanged && timeDiff < 60 * 60 * 1000;
  }

  // Calculate progress between locations
  let progress = 0.5; // Default to middle if we can't calculate

  // If we're very close to a location (within 50km), show at that location
  if (nearestLocation.distanceKm <= 50) {
    progress = 0.5; // Show car centered on the location
  } else {
    // Calculate progress between current and next location
    const nextLocationIndex = nearestIndex + 1;
    if (nextLocationIndex < locations.length) {
      const nextLocation = locations[nextLocationIndex];
      if (nextLocation.coordinates) {
        const distanceToNext = calculateDistance(
          currentLat,
          currentLng,
          nextLocation.coordinates.lat,
          nextLocation.coordinates.lng
        );

        const totalDistance = nearestLocation.distanceKm + distanceToNext;
        if (totalDistance > 0) {
          // Progress from current location towards next (0 = at current, 1 = at next)
          progress = nearestLocation.distanceKm / totalDistance;
          progress = Math.max(0, Math.min(1, progress));
        }
      }
    }
  }

  // Determine if car should be visible
  // Show if we're within reasonable distance of the tour route (500km buffer)
  const isVisible = nearestLocation.distanceKm <= 500;

  return {
    isVisible,
    locationIndex: nearestIndex,
    progress,
    isMoving,
    lastUpdated: new Date(currentPing.timestamp || new Date()),
  };
}

/**
 * Get a user-friendly message about the current car position
 */
export function getPositionMessage(
  carPosition: CarPosition,
  locations: Location[]
): string {
  if (!carPosition.isVisible) {
    return "Das Auto ist zu weit von der Route entfernt 🗺️";
  }

  const currentLocation = locations[carPosition.locationIndex];
  if (!currentLocation) {
    return "Position wird berechnet... 🚗";
  }

  const nextLocation = locations[carPosition.locationIndex + 1];

  if (carPosition.progress <= 0.3) {
    return `Das Auto ist in ${currentLocation.name} 📍`;
  } else if (carPosition.progress >= 0.7 && nextLocation) {
    return `Das Auto nähert sich ${nextLocation.name} 🚗💨`;
  } else if (nextLocation) {
    return `Das Auto ist auf dem Weg von ${currentLocation.name} nach ${nextLocation.name} 🛣️`;
  } else {
    return `Das Auto hat ${currentLocation.name} erreicht! 🎉`;
  }
}

/**
 * Calculate the visual position of the car on the timeline
 * Returns CSS properties for positioning
 */
export function calculateTimelinePosition(
  carPosition: CarPosition,
  timelineRef?: HTMLElement
): {
  top: number;
  isVisible: boolean;
  shouldShowBetween: boolean;
  betweenIndex?: number;
} {
  if (!carPosition.isVisible || !timelineRef) {
    return {
      top: 0,
      isVisible: false,
      shouldShowBetween: false,
    };
  }

  // Find timeline items (location cards)
  const timelineItems = timelineRef.querySelectorAll('[data-testid^="timeline-item-"]');
  
  if (timelineItems.length === 0) {
    return {
      top: 0,
      isVisible: false,
      shouldShowBetween: false,
    };
  }

  const currentItemIndex = Math.min(carPosition.locationIndex, timelineItems.length - 1);
  const currentItem = timelineItems[currentItemIndex] as HTMLElement;
  const nextItem = timelineItems[currentItemIndex + 1] as HTMLElement;

  const currentItemRect = currentItem.getBoundingClientRect();
  const timelineRect = timelineRef.getBoundingClientRect();

  // Base position at current location
  let top = currentItemRect.top - timelineRect.top + (currentItemRect.height / 2);

  // If we have significant progress and a next item, interpolate position
  if (carPosition.progress > 0.3 && nextItem) {
    const nextItemRect = nextItem.getBoundingClientRect();
    const nextTop = nextItemRect.top - timelineRect.top + (nextItemRect.height / 2);
    
    // Interpolate between current and next position
    const progressAdjusted = (carPosition.progress - 0.3) / 0.7; // Normalize to 0-1
    top = top + (nextTop - top) * progressAdjusted;

    return {
      top,
      isVisible: true,
      shouldShowBetween: true,
      betweenIndex: currentItemIndex,
    };
  }

  return {
    top,
    isVisible: true,
    shouldShowBetween: false,
  };
}

/**
 * Cache for storing last calculated position to detect movement
 */
let lastCarPosition: CarPosition | undefined;

/**
 * Get the current car position with movement detection
 */
export function getCurrentCarPosition(
  currentPing: LocationPing | null,
  locations: Location[]
): CarPosition {
  const newPosition = calculateCarPosition(currentPing, locations, lastCarPosition);
  lastCarPosition = newPosition;
  return newPosition;
}