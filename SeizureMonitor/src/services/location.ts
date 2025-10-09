import Geolocation from 'react-native-geolocation-service';
import { Platform, PermissionsAndroid } from 'react-native';

class LocationService {
  async requestLocationPermission(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      const result = await Geolocation.requestAuthorization('whenInUse');
      return result === 'granted';
    } else {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app needs access to your location to provide emergency services.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    }
  }

  async getCurrentLocation(): Promise<{ lat: number; lng: number }> {
    const hasPermission = await this.requestLocationPermission();

    if (!hasPermission) {
      throw new Error('Location permission denied');
    }

    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Location error:', error);
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    });
  }

  getMapsUrl(location: { lat: number; lng: number }): string {
    return `https://www.google.com/maps?q=${location.lat},${location.lng}`;
  }
}

export const locationService = new LocationService();