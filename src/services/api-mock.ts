// Mock API for standalone demo
class MockApiService {
  private token: string | null = 'mock-token';
  private mockContacts = [
    { id: 1, name: 'Emergency Contact 1', phone_number: '+6591234567' }
  ];

  async login(email: string, password: string): Promise<any> {
    if (email === 'test@example.com' && password === 'test123') {
      localStorage.setItem('authToken', 'mock-token');
      localStorage.setItem('user', JSON.stringify({
        id: '1',
        email,
        name: 'John Doe'
      }));
      return {
        token: 'mock-token',
        user: { id: '1', email, name: 'John Doe' }
      };
    }
    throw new Error('Invalid credentials');
  }

  async register(email: string, password: string, name: string): Promise<any> {
    localStorage.setItem('authToken', 'mock-token');
    localStorage.setItem('user', JSON.stringify({ id: '1', email, name }));
    return {
      token: 'mock-token',
      user: { id: '1', email, name }
    };
  }

  logout(): void {
    this.token = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  }

  getUser(): any {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  async getContacts(): Promise<any[]> {
    return this.mockContacts;
  }

  async addContact(name: string, phoneNumber: string): Promise<any> {
    const newContact = {
      id: Date.now(),
      name,
      phone_number: phoneNumber
    };
    this.mockContacts.push(newContact);
    return newContact;
  }

  async updateContact(id: number, name: string, phoneNumber: string): Promise<any> {
    const contact = this.mockContacts.find(c => c.id === id);
    if (contact) {
      contact.name = name;
      contact.phone_number = phoneNumber;
    }
    return contact;
  }

  async deleteContact(id: number): Promise<void> {
    this.mockContacts = this.mockContacts.filter(c => c.id !== id);
  }

  async triggerEmergency(data: any): Promise<any> {
    return {
      message: 'Demo mode - SMS/calls disabled',
      contactsNotified: this.mockContacts.length
    };
  }

  async updateUserName(name: string): Promise<void> {
    const user = this.getUser();
    if (user) {
      user.name = name;
      localStorage.setItem('user', JSON.stringify(user));
    }
  }

  async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    // Mock success
    return Promise.resolve();
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    };
  }
}

export const apiService = new MockApiService();