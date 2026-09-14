export type NotificationType = 'DAILY' | 'MANUAL';

export interface NotificationMessage {
  id: string;
  title: string;
  body: string;
  deepLink?: string;
  type: NotificationType;
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface NotificationInput {
  title: string;
  body: string;
  deepLink?: string;
  type: NotificationType;
  enabled: boolean;
}

export interface NotificationApiResponse<T> {
  message: string;
  data: T;
}
