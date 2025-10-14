import AsyncStorage from '@react-native-async-storage/async-storage';

const WS_URL = 'ws://localhost:8000/ws'; // Mac backend (use localhost for iOS simulator)

export type SensorData = {
  id: string;
  timestamp: string;
  heart_rate?: number;
  spo2?: number;
  temperature?: number;
  humidity?: number;
  gas_resistance?: number;
  menthone_resistance?: number;
  emg_level?: number;
  battery_level?: number;
  signal_quality?: number;
};

export type WebSocketMessage = {
  type: 'sensor_update' | 'emergency_alert' | 'client_disconnected' | 'pong';
  user_id?: string;
  client_id?: string;
  data?: SensorData;
};

type MessageHandler = (message: WebSocketMessage) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private isConnecting: boolean = false;
  private shouldReconnect: boolean = true;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectDelay: number = 3000; // 3 seconds

  constructor() {
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.send = this.send.bind(this);
    this.addMessageHandler = this.addMessageHandler.bind(this);
    this.removeMessageHandler = this.removeMessageHandler.bind(this);
  }

  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    this.shouldReconnect = true;

    try {
      // Get user token for authentication
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.warn('No auth token found, cannot connect to WebSocket');
        this.isConnecting = false;
        return;
      }

      // Create WebSocket connection with token as query parameter
      const wsUrl = `${WS_URL}?token=${token}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;

        // Send ping to keep connection alive
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.notifyHandlers(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnecting = false;
        this.ws = null;

        // Attempt to reconnect if enabled
        if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`Reconnecting... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

          this.reconnectTimeout = setTimeout(() => {
            this.connect();
          }, this.reconnectDelay * this.reconnectAttempts);
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('Max reconnection attempts reached');
        }
      };
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      this.isConnecting = false;
    }
  }

  disconnect(): void {
    this.shouldReconnect = false;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.reconnectAttempts = 0;
    console.log('WebSocket disconnected manually');
  }

  send(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }

  addMessageHandler(handler: MessageHandler): void {
    this.messageHandlers.add(handler);
  }

  removeMessageHandler(handler: MessageHandler): void {
    this.messageHandlers.delete(handler);
  }

  private notifyHandlers(message: WebSocketMessage): void {
    this.messageHandlers.forEach((handler) => {
      try {
        handler(message);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    });
  }

  private startHeartbeat(): void {
    // Send ping every 30 seconds to keep connection alive
    const interval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
      } else {
        clearInterval(interval);
      }
    }, 30000);
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const websocketService = new WebSocketService();
