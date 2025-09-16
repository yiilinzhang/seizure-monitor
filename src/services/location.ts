// Location Service for Emergency Alerts

export interface Location {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: number;
}

class LocationService {
  private watchId: number | null = null;
  private lastLocation: Location | null = null;

  // Request location permission
  async requestPermission(): Promise<boolean> {
    if (!('geolocation' in navigator)) {
      console.error('Geolocation not supported');
      return false;
    }

    try {
      // Try to get current position to trigger permission prompt
      await this.getCurrentLocation();
      return true;
    } catch (error) {
      console.error('Location permission denied:', error);
      return false;
    }
  }

  // Get current location
  getCurrentLocation(): Promise<Location> {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: Location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          };
          this.lastLocation = location;
          resolve(location);
        },
        (error) => {
          console.error('Location error:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        }
      );
    });
  }

  // Watch location changes
  watchLocation(callback: (location: Location) => void): void {
    if (!('geolocation' in navigator)) {
      console.error('Geolocation not supported');
      return;
    }

    this.stopWatching(); // Clear any existing watch

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location: Location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };
        this.lastLocation = location;
        callback(location);
      },
      (error) => {
        console.error('Location watch error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }

  // Stop watching location
  stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  // Get last known location
  getLastLocation(): Location | null {
    return this.lastLocation;
  }

  // Get Google Maps URL for location
  getMapsUrl(location: Location): string {
    return `https://www.google.com/maps?q=${location.lat},${location.lng}`;
  }

  // Calculate distance between two points (in meters)
  calculateDistance(loc1: Location, loc2: Location): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (loc1.lat * Math.PI) / 180;
    const φ2 = (loc2.lat * Math.PI) / 180;
    const Δφ = ((loc2.lat - loc1.lat) * Math.PI) / 180;
    const Δλ = ((loc2.lng - loc1.lng) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}

export const locationService = new LocationService();