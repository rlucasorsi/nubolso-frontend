import { HttpClient } from '@/network/http-client';
import type {
  Notification,
  NotificationListResponse,
  UnreadCountResponse,
  PushSubscriptionRequest,
} from '../model/api/notification';

export const notificationsService = {
  getAll: async (page = 1, pageSize = 20) => {
    return HttpClient.get<NotificationListResponse, undefined>(
      `/notifications?page=${page}&pageSize=${pageSize}`,
    );
  },

  getUnreadCount: async () => {
    return HttpClient.get<UnreadCountResponse, undefined>('/notifications/unread-count');
  },

  markRead: async (id: string) => {
    return HttpClient.post<Notification, undefined>(`/notifications/${id}/read`, undefined);
  },

  markAllRead: async () => {
    return HttpClient.post<void, undefined>('/notifications/read-all', undefined);
  },

  subscribePush: async (subscription: PushSubscriptionRequest) => {
    return HttpClient.post<void, PushSubscriptionRequest>('/push/subscribe', subscription);
  },

  unsubscribePush: async (endpoint: string) => {
    return HttpClient.post<void, { endpoint: string }>('/push/unsubscribe', { endpoint });
  },
};
