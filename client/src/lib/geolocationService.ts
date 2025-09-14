import { apiRequest } from "@/lib/queryClient";
import type { InsertLocationPing } from "@shared/schema";

interface GeolocationState {
  isEnabled: boolean;
  hasPermission: boolean;
  lastPosition: GeolocationPosition | null;
  intervalId: number | null;
  isTracking: boolean;
}

class GeolocationService {
  private state: GeolocationState = {
    isEnabled: false,
    hasPermission: false,
    lastPosition: null,
    intervalId: null,
    isTracking: false,
  };

  private readonly TRACKING_INTERVAL = 30 * 60 * 1000; // 30 minutes in milliseconds
  private readonly POSITION_OPTIONS: PositionOptions = {
    enableHighAccuracy: false, // Use less battery for tours
    timeout: 10000, // 10 seconds timeout
    maximumAge: 5 * 60 * 1000, // Accept 5-minute old position
  };

  /**
   * Check if geolocation is available in the browser
   */
  isGeolocationAvailable(): boolean {
    return "geolocation" in navigator;
  }

  /**
   * Request permission and start location tracking
   * Returns a friendly message about the result
   */
  async requestLocationTracking(): Promise<{
    success: boolean;
    message: string;
    canTrack: boolean;
  }> {
    if (!this.isGeolocationAvailable()) {
      return {
        success: false,
        message: "GPS ist in diesem Browser nicht verfügbar. Die App funktioniert trotzdem!",
        canTrack: false,
      };
    }

    try {
      // Request permission by trying to get current position
      const position = await this.getCurrentPosition();
      
      this.state.hasPermission = true;
      this.state.lastPosition = position;
      
      // Send initial location ping
      await this.sendLocationPing(position);
      
      // Start periodic tracking
      this.startPeriodicTracking();
      
      return {
        success: true,
        message: "🚗 Super! Euer Auto wird jetzt auf der Timeline angezeigt und zeigt euren Reisefortschritt.",
        canTrack: true,
      };
    } catch (error) {
      console.log("Geolocation permission denied or failed:", error);
      
      let message = "Kein Problem! Das Live-Auto ist optional. Ihr könnt die Tour-App trotzdem vollständig nutzen.";
      
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case GeolocationPositionError.PERMISSION_DENIED:
            message = "GPS-Berechtigung wurde verweigert. Die App funktioniert trotzdem perfekt!";
            break;
          case GeolocationPositionError.POSITION_UNAVAILABLE:
            message = "GPS-Position ist momentan nicht verfügbar. Versucht es später nochmal!";
            break;
          case GeolocationPositionError.TIMEOUT:
            message = "GPS-Abfrage dauert zu lange. Das Live-Auto ist aber optional!";
            break;
        }
      }
      
      return {
        success: false,
        message,
        canTrack: false,
      };
    }
  }

  /**
   * Get current position as a Promise
   */
  private getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        this.POSITION_OPTIONS
      );
    });
  }

  /**
   * Send location ping to backend
   */
  private async sendLocationPing(position: GeolocationPosition): Promise<void> {
    try {
      const locationPing: InsertLocationPing = {
        latitude: position.coords.latitude.toString(),
        longitude: position.coords.longitude.toString(),
        accuracy: Math.round(position.coords.accuracy),
        deviceId: this.getDeviceId(),
        timestamp: new Date(position.timestamp),
      };

      await apiRequest("POST", "/api/location-ping", locationPing);

      console.log("📍 Location ping sent successfully");
    } catch (error) {
      console.error("Failed to send location ping:", error);
      // Store failed pings for later retry (offline support)
      this.storePendingPing(position);
    }
  }

  /**
   * Start periodic location tracking every 30 minutes
   */
  private startPeriodicTracking(): void {
    if (this.state.intervalId) {
      clearInterval(this.state.intervalId);
    }

    this.state.isTracking = true;
    
    this.state.intervalId = window.setInterval(async () => {
      try {
        const position = await this.getCurrentPosition();
        this.state.lastPosition = position;
        await this.sendLocationPing(position);
        
        // Try to send any pending pings when online
        await this.retryPendingPings();
      } catch (error) {
        console.log("Periodic location update failed:", error);
        // Don't spam the user with errors - this is background tracking
      }
    }, this.TRACKING_INTERVAL);

    console.log("🚗 Location tracking started - updating every 30 minutes");
  }

  /**
   * Stop location tracking
   */
  stopLocationTracking(): void {
    if (this.state.intervalId) {
      clearInterval(this.state.intervalId);
      this.state.intervalId = null;
    }
    this.state.isTracking = false;
    console.log("🚗 Location tracking stopped");
  }

  /**
   * Get a simple device/session identifier
   */
  private getDeviceId(): string {
    let deviceId = localStorage.getItem("tour-device-id");
    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("tour-device-id", deviceId);
    }
    return deviceId;
  }

  /**
   * Store failed pings for offline support
   */
  private storePendingPing(position: GeolocationPosition): void {
    try {
      const pendingPings = JSON.parse(
        localStorage.getItem("tour-pending-pings") || "[]"
      );
      
      pendingPings.push({
        latitude: position.coords.latitude.toString(),
        longitude: position.coords.longitude.toString(),
        accuracy: Math.round(position.coords.accuracy),
        deviceId: this.getDeviceId(),
        timestamp: new Date(position.timestamp).toISOString(),
      });

      // Keep only last 10 pending pings to avoid storage bloat
      if (pendingPings.length > 10) {
        pendingPings.splice(0, pendingPings.length - 10);
      }

      localStorage.setItem("tour-pending-pings", JSON.stringify(pendingPings));
    } catch (error) {
      console.error("Failed to store pending ping:", error);
    }
  }

  /**
   * Retry sending pending pings when back online
   */
  private async retryPendingPings(): Promise<void> {
    try {
      const pendingPings = JSON.parse(
        localStorage.getItem("tour-pending-pings") || "[]"
      );

      if (pendingPings.length === 0) return;

      // Try to send all pending pings
      for (const ping of pendingPings) {
        try {
          await apiRequest("POST", "/api/location-ping", ping);
        } catch (error) {
          // If one fails, stop trying to avoid spam
          console.log("Still offline, will retry later");
          return;
        }
      }

      // Clear pending pings if all succeeded
      localStorage.removeItem("tour-pending-pings");
      console.log(`📍 Successfully sent ${pendingPings.length} pending location pings`);
    } catch (error) {
      console.error("Failed to retry pending pings:", error);
    }
  }

  /**
   * Get current tracking state
   */
  getState(): GeolocationState {
    return { ...this.state };
  }

  /**
   * Get last known position
   */
  getLastPosition(): GeolocationPosition | null {
    return this.state.lastPosition;
  }

  /**
   * Check if currently tracking
   */
  isTracking(): boolean {
    return this.state.isTracking;
  }
}

// Export singleton instance
export const geolocationService = new GeolocationService();
export default geolocationService;