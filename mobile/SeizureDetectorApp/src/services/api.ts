// API Service for communicating with FastAPI backend
import axios, {AxiosInstance} from 'axios';

// Backend URL - change this to your backend URL
// For iOS simulator: http://localhost:8000
// For Android emulator: http://10.0.2.2:8000
// For physical device: http://<your-computer-ip>:8000
const API_BASE_URL = 'http://localhost:8000';

interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

interface User {
  id: string;
  email: string;
  name: string;
}

interface Contact {
  id: number;
  name: string;
  phone_number: string;
  user_id: string;
  created_at: string;
}

interface EmergencyTriggerData {
  userId: string;
  eventId: string;
  location: {
    lat: number;
    lng: number;
  };
  delta_pct: number;
  timestamp: number;
  sendSMS: boolean;
  sendCall: boolean;
}

class ApiService {
  private client: AxiosInstance;
  private token: string | null = null;
  private user: User | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.client.interceptors.request.use(
      config => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      error => Promise.reject(error),
    );
  }

  // Auth methods
  async login(email: string, password: string): Promise<User> {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await this.client.post<AuthResponse>(
      '/api/v1/auth/login',
      formData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    this.token = response.data.access_token;
    this.user = response.data.user;
    return response.data.user;
  }

  async register(email: string, password: string, name: string): Promise<User> {
    const response = await this.client.post<AuthResponse>(
      '/api/v1/auth/register',
      {
        email,
        password,
        name,
      },
    );

    this.token = response.data.access_token;
    this.user = response.data.user;
    return response.data.user;
  }

  logout() {
    this.token = null;
    this.user = null;
  }

  isAuthenticated(): boolean {
    return this.token !== null;
  }

  getUser(): User | null {
    return this.user;
  }

  // Emergency contacts
  async getContacts(): Promise<Contact[]> {
    const response = await this.client.get<Contact[]>('/api/v1/contacts');
    return response.data;
  }

  async addContact(name: string, phone_number: string): Promise<Contact> {
    const response = await this.client.post<Contact>('/api/v1/contacts', {
      name,
      phone_number,
    });
    return response.data;
  }

  async updateContact(
    id: number,
    name: string,
    phone_number: string,
  ): Promise<Contact> {
    const response = await this.client.put<Contact>(`/api/v1/contacts/${id}`, {
      name,
      phone_number,
    });
    return response.data;
  }

  async deleteContact(id: number): Promise<void> {
    await this.client.delete(`/api/v1/contacts/${id}`);
  }

  // Emergency trigger
  async triggerEmergency(data: EmergencyTriggerData): Promise<any> {
    const response = await this.client.post('/api/v1/trigger', data);
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<any> {
    const response = await this.client.get('/health/status');
    return response.data;
  }
}

export const apiService = new ApiService();
export type {User, Contact, EmergencyTriggerData};
