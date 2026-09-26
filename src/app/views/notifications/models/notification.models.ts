export type NotificationType = 'DAILY' | 'MANUAL';
export type NotificationPlatform = 'android' | 'ios';

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

export interface NotificationRecipient {
  userId: string;
  email: string;
  displayName: string;
  enabled: boolean;
  dailyEnabled: boolean;
  preferenceConfigured: boolean;
  activeDeviceCount: number;
  platforms: NotificationPlatform[];
  lastSeenAt: number;
}

export interface NotificationDeliveryResult {
  notificationId: string;
  recipientCount: number;
  deviceCount: number;
  successCount: number;
  failureCount: number;
  invalidDeviceCount: number;
  sentAt: number;
}

export interface NotificationApiResponse<T> {
  message: string;
  data: T;
}
