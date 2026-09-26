import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import {
  NotificationDeliveryResult,
  NotificationInput,
  NotificationMessage,
  NotificationRecipient,
} from '../models/notification.models';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let http: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/admin/notifications`;

  const notification: NotificationMessage = {
    id: 'notification-1',
    title: 'Titolo',
    body: 'Messaggio',
    deepLink: 'comemivesto://outfit/1',
    type: 'DAILY',
    enabled: true,
    createdAt: 1,
    updatedAt: 2,
  };

  const input: NotificationInput = {
    title: 'Titolo',
    body: 'Messaggio',
    deepLink: 'comemivesto://outfit/1',
    type: 'DAILY',
    enabled: true,
  };

  const recipient: NotificationRecipient = {
    userId: 'user-1',
    email: 'user@example.com',
    displayName: 'Utente',
    enabled: true,
    dailyEnabled: true,
    preferenceConfigured: true,
    activeDeviceCount: 1,
    platforms: ['android'],
    lastSeenAt: 3,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(NotificationService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads notifications', () => {
    service.getNotifications().subscribe((value) => expect(value).toEqual([notification]));
    const request = http.expectOne(baseUrl);
    expect(request.request.method).toBe('GET');
    request.flush({ message: 'Success', data: [notification] });
  });

  it('loads notification recipients', () => {
    service.getRecipients().subscribe((value) => expect(value).toEqual([recipient]));
    const request = http.expectOne(`${baseUrl}/recipients`);
    expect(request.request.method).toBe('GET');
    request.flush({ message: 'Success', data: [recipient] });
  });

  it('creates a notification', () => {
    service.createNotification(input).subscribe((value) => expect(value).toEqual(notification));
    const request = http.expectOne(baseUrl);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(input);
    request.flush({ message: 'Success', data: notification });
  });

  it('updates a notification', () => {
    service.updateNotification(notification.id, { ...input, enabled: false }).subscribe();
    const request = http.expectOne(`${baseUrl}/${notification.id}`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body.enabled).toBeFalse();
    request.flush({ message: 'Success', data: { ...notification, enabled: false } });
  });

  it('sends a notification', () => {
    const result: NotificationDeliveryResult = {
      notificationId: notification.id,
      recipientCount: 1,
      deviceCount: 1,
      successCount: 1,
      failureCount: 0,
      invalidDeviceCount: 0,
      sentAt: 4,
    };

    service.sendNotification(notification.id).subscribe((value) => expect(value).toEqual(result));
    const request = http.expectOne(`${baseUrl}/${notification.id}/send`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});
    request.flush({ message: 'Success', data: result });
  });
});
