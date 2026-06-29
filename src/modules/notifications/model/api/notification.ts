export type NotificationType = 'RECURRING_DUE' | 'INVOICE_DUE' | 'BALANCE_WARNING' | 'GENERIC';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  /** Optional extra data (e.g. { url: '/dashboard' }) */
  data?: Record<string, string>;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  data: Notification[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UnreadCountResponse {
  count: number;
}

export interface PushSubscriptionRequest {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}
