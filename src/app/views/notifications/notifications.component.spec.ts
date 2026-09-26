import { buildNotificationInput } from './forms/notification-form-host.component';
import { NotificationMessage, NotificationRecipient } from './models/notification.models';
import {
  buildNotificationColumns,
  buildNotificationGridRows,
  buildNotificationRecipientRows,
} from './notifications.component';

describe('NotificationsComponent helpers', () => {
  const notification: NotificationMessage = {
    id: 'notification-1',
    title: 'Titolo',
    body: 'Messaggio',
    type: 'DAILY',
    enabled: true,
    createdAt: 1,
    updatedAt: 2,
  };

  it('builds notification rows for the shared DataGrid', () => {
    const [row] = buildNotificationGridRows([notification]);
    expect(row.typeLabel).toBe('Giornaliera');
    expect(row.enabledLabel).toBe('Sì');
    expect(row.deepLinkLabel).toBe('—');
  });

  it('keeps edit, toggle and send actions in the grid', () => {
    const actions = buildNotificationColumns()[0].data
      ?.filter((column) => column.type === 'campoButton')
      .map((column) => column.button?.name);
    expect(actions).toEqual(['edit', 'toggle', 'send']);
  });

  it('builds recipient status rows without exposing push tokens', () => {
    const recipient: NotificationRecipient = {
      userId: 'user-1',
      email: 'user@example.com',
      displayName: 'Mario',
      enabled: true,
      dailyEnabled: false,
      preferenceConfigured: true,
      activeDeviceCount: 2,
      platforms: ['android', 'ios'],
      lastSeenAt: 3,
    };

    const [row] = buildNotificationRecipientRows([recipient]);
    expect(row.enabledLabel).toBe('Attive');
    expect(row.dailyEnabledLabel).toBe('No');
    expect(row.platformsLabel).toBe('Android, iOS');
    expect(row.preferenceLabel).toBe('Personalizzate');
    expect((row as any).token).toBeUndefined();
  });

  it('builds the backend input using the existing form semantics', () => {
    expect(buildNotificationInput({
      title: ' Titolo ',
      body: ' Messaggio ',
      deepLink: ' comemivesto://outfit/1 ',
      type: 'MANUAL',
      enabled: false,
    })).toEqual({
      title: 'Titolo',
      body: 'Messaggio',
      deepLink: 'comemivesto://outfit/1',
      type: 'MANUAL',
      enabled: false,
    });
  });
});
