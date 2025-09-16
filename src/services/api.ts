// Use mock API for standalone demo when backend is not available
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const USE_MOCK = false; // Set to true to use mock API without backend

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
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('authToken');
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
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
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
    this.token = data.token;
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  }

  logout(): void {
    this.token = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getUser(): any {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error parsing user data:', error);
      // Clear corrupted data
      localStorage.removeItem('user');
      return null;
    }
  }

  // Emergency contacts methods
  async getContacts(): Promise<Contact[]> {
    const response = await fetch(`${API_URL}/contacts`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.logout();
        throw new Error('Session expired. Please login again.');
      }
      throw new Error('Failed to fetch contacts');
    }

    const data = await response.json();
    return data.contacts || [];
  }

  async addContact(name: string, phoneNumber: string): Promise<Contact> {
    const response = await fetch(`${API_URL}/contacts`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ name, phone_number: phoneNumber }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add contact');
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
      throw new Error(error.error || 'Failed to update contact');
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
      throw new Error(error.error || 'Failed to delete contact');
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
    const user = this.getUser();
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
    // Update stored user data
    const updatedUser = { ...user, name: data.name };
    localStorage.setItem('user', JSON.stringify(updatedUser));
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