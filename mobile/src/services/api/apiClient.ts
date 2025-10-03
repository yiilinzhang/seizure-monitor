import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { syncQueue } from '../sync/syncQueue';

const API_BASE_URL = __DEV__
  ? 'http://localhost:8000/api/v1'
  : 'https://your-api-domain.com/api/v1';

class ApiClient {
  private token: string | null = null;
  private user: any = null;

  constructor() {
    this.loadToken();
  }

  private async loadToken() {
    this.token = await AsyncStorage.getItem('authToken');
    const userStr = await AsyncStorage.getItem('user');
    if (userStr) {
      this.user = JSON.parse(userStr);
    }
  }

  private async getHeaders() {
    const headers: any = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request(
    endpoint: string,
    options: RequestInit = {},
    retry = true
  ): Promise<any> {
    const netInfo = await NetInfo.fetch();

    // If offline, queue the request
    if (!netInfo.isConnected && options.method !== 'GET') {
      await syncQueue.addToQueue({
        endpoint,
        options,
        timestamp: Date.now(),
      });
      throw new Error('Request queued for offline sync');
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: await this.getHeaders(),
      });

      if (response.status === 401 && retry) {
        // Token expired, try to refresh or re-login
        await AsyncStorage.removeItem('authToken');
        this.token = null;
        throw new Error('Authentication required');
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (!netInfo.isConnected) {
        // Save to offline queue
        await syncQueue.addToQueue({
          endpoint,
          options,
          timestamp: Date.now(),
        });
      }
      throw error;
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      throw new Error('Invalid credentials');
    }

    const data = await response.json();
    this.token = data.access_token;
    this.user = data.user;

    await AsyncStorage.setItem('authToken', this.token);
    await AsyncStorage.setItem('user', JSON.stringify(this.user));

    return data;
  }

  async register(email: string, password: string, name: string) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });

    this.token = response.token;
    this.user = response.user;

    await AsyncStorage.setItem('authToken', this.token);
    await AsyncStorage.setItem('user', JSON.stringify(this.user));

    return response;
  }

  async logout() {
    this.token = null;
    this.user = null;
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
  }

  getUser() {
    return this.user;
  }

  // Emergency contacts endpoints
  async getContacts() {
    return await this.request('/contacts');
  }

  async addContact(data: { name: string; phone_number: string }) {
    return await this.request('/contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateContact(id: string | number, data: any) {
    return await this.request(`/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteContact(id: string | number) {
    return await this.request(`/contacts/${id}`, {
      method: 'DELETE',
    });
  }

  // Emergency trigger
  async triggerEmergency(data: any) {
    return await this.request('/emergency/trigger', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Sensor data endpoints
  async sendSensorData(data: any) {
    return await this.request('/sensors/data', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSensorHistory(userId: string, limit = 100) {
    return await this.request(`/sensors/history/${userId}?limit=${limit}`);
  }

  // ML model endpoints
  async getLatestModel() {
    return await this.request('/ml/model/latest');
  }

  async downloadModel(modelId: string) {
    const response = await fetch(`${API_BASE_URL}/ml/model/${modelId}/download`, {
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to download model');
    }

    return await response.blob();
  }
}

export const apiService = new ApiClient();