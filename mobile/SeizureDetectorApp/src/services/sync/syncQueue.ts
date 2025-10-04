import AsyncStorage from '@react-native-async-storage/async-storage';

interface QueuedRequest {
  endpoint: string;
  options: RequestInit;
  timestamp: number;
}

class SyncQueue {
  private queueKey = 'offline_sync_queue';

  async addToQueue(request: QueuedRequest): Promise<void> {
    try {
      const queueStr = await AsyncStorage.getItem(this.queueKey);
      const queue: QueuedRequest[] = queueStr ? JSON.parse(queueStr) : [];

      queue.push(request);

      await AsyncStorage.setItem(this.queueKey, JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to add request to sync queue:', error);
    }
  }

  async getQueue(): Promise<QueuedRequest[]> {
    try {
      const queueStr = await AsyncStorage.getItem(this.queueKey);
      return queueStr ? JSON.parse(queueStr) : [];
    } catch (error) {
      console.error('Failed to get sync queue:', error);
      return [];
    }
  }

  async removeFromQueue(request: QueuedRequest): Promise<void> {
    try {
      const queue = await this.getQueue();
      const filteredQueue = queue.filter(
        item => item.timestamp !== request.timestamp,
      );

      await AsyncStorage.setItem(this.queueKey, JSON.stringify(filteredQueue));
    } catch (error) {
      console.error('Failed to remove request from sync queue:', error);
    }
  }

  async clearQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.queueKey);
    } catch (error) {
      console.error('Failed to clear sync queue:', error);
    }
  }

  async processQueue(apiClient: any): Promise<void> {
    const queue = await this.getQueue();

    for (const request of queue) {
      try {
        await fetch(request.endpoint, request.options);
        await this.removeFromQueue(request);
      } catch (error) {
        console.error('Failed to process queued request:', error);
        // Keep in queue for next sync attempt
      }
    }
  }
}

export const syncQueue = new SyncQueue();
