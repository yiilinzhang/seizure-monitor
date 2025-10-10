import AsyncStorage from '@react-native-async-storage/async-storage';

// Connect to FastAPI backend
const API_URL = 'http://localhost:8000/api/v1'; // Update with your backend URL

interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

interface Contact {
  id?: number;
  name: string;
  phone_number: string;
}

class ApiService {
  private token: string | null = null;

  constructor() {
    // Load token from AsyncStorage on initialization
    this.loadToken();
  }

  private async loadToken() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      this.token = token;
    } catch (error) {
      console.error('Error loading token:', error);
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Auth methods
  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    const data = await response.json();
    this.token = data.token;
    await AsyncStorage.setItem('authToken', data.token);
    await AsyncStorage.setItem('user', JSON.stringify(data.user));
    return data;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    // Handle both token formats
    const token = data.token || data.access_token;
    this.token = token;
    await AsyncStorage.setItem('authToken', token);
    await AsyncStorage.setItem('user', JSON.stringify(data.user));

    // Ensure token is set for immediate use
    await this.loadToken();

    return data;
  }

  async logout(): Promise<void> {
    this.token = null;
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
  }

  async isAuthenticated(): Promise<boolean> {
    await this.loadToken();
    return !!this.token;
  }

  async getUser(): Promise<any> {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (!userStr) return null;
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing user data:', error);
      await AsyncStorage.removeItem('user');
      return null;
    }
  }

  // Emergency contacts methods
  async getContacts(): Promise<Contact[]> {
    // Ensure token is loaded
    await this.loadToken();

    const response = await fetch(`${API_URL}/contacts/`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        await this.logout();
        throw new Error('Session expired. Please login again.');
      }
      throw new Error('Failed to fetch contacts');
    }

    const data = await response.json();
    return data.contacts || [];
  }

  async addContact(name: string, phoneNumber: string): Promise<Contact> {
    // Ensure token is loaded
    await this.loadToken();

    const response = await fetch(`${API_URL}/contacts/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ name, phone_number: phoneNumber }),
    });

    if (!response.ok) {
      const error = await response.json();
      // Handle specific error cases
      if (response.status === 409) {
        throw new Error('A contact with this phone number already exists');
      }
      throw new Error(error.detail || error.error || 'Failed to add contact');
    }

    const data = await response.json();
    return data.contact;
  }

  async updateContact(id: number, name: string, phoneNumber: string): Promise<Contact> {
    const response = await fetch(`${API_URL}/contacts/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ name, phone_number: phoneNumber }),
    });

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 404) {
        throw new Error('Contact not found');
      }
      if (response.status === 409) {
        throw new Error('A contact with this phone number already exists');
      }
      throw new Error(error.detail || error.error || 'Failed to update contact');
    }

    const data = await response.json();
    return data.contact;
  }

  async deleteContact(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/contacts/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 404) {
        throw new Error('Contact not found');
      }
      throw new Error(error.detail || error.error || 'Failed to delete contact');
    }
  }

  // Emergency trigger (for testing)
  async triggerEmergency(data: any): Promise<any> {
    const response = await fetch(`${API_URL}/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to trigger emergency');
    }

    return response.json();
  }

  // Update user name
  async updateUserName(name: string): Promise<void> {
    const user = await this.getUser();
    if (!user) throw new Error('User not authenticated');

    const response = await fetch(`${API_URL}/auth/update-name`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update name');
    }

    const data = await response.json();
    const updatedUser = { ...user, name: data.name };
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
  }

  // Update user password
  async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response = await fetch(`${API_URL}/auth/update-password`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update password');
    }
  }
}

export const apiService = new ApiService();