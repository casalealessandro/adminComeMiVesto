import { buildNotificationInput } from './forms/notification-form-host.component';
import { NotificationMessage, NotificationRecipient } from './models/notification.models';
import {
  buildNotificationColumns,
  buildNotificationGridRows,
  buildNotificationRecipientColumns,
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

  it('uses the normalized user label as the sortable recipient identity column', () => {
    expect(buildNotificationRecipientColumns()[0].data?.[0].dataField).toBe('userLabel');

    const [row] = buildNotificationRecipientRows([{
      userId: 'uid-fallback',
      email: '',
      displayName: '',
      enabled: true,
      dailyEnabled: true,
      preferenceConfigured: false,
      activeDeviceCount: 0,
      platforms: [],
      lastSeenAt: 0,
    }]);

    expect(row.userLabel).toBe('uid-fallback');
  });

  it('separates push preference, active device and effective delivery state', () => {
    const recipients: NotificationRecipient[] = [
      {
        userId: 'user-1',
        email: 'user@example.com',
        displayName: 'Mario',
        enabled: true,
        dailyEnabled: false,
        preferenceConfigured: true,
        activeDeviceCount: 2,
        platforms: ['android', 'ios'],
        lastSeenAt: 3,
      },
      {
        userId: 'user-2',
        email: 'default@example.com',
        displayName: 'Default User',
        enabled: true,
        dailyEnabled: true,
        preferenceConfigured: false,
        activeDeviceCount: 0,
        platforms: [],
        lastSeenAt: 0,
      },
    ];

    const [registered, defaultUser] = buildNotificationRecipientRows(recipients);
    expect(registered.userLabel).toBe('Mario');
    expect(registered.preferenceLabel).toBe('Attive');
    expect(registered.deviceLabel).toBe('Sì (2)');
    expect(registered.deliveryLabel).toBe('Sì');
    expect(registered.dailyEnabledLabel).toBe('No');
    expect(registered.platformsLabel).toBe('Android, iOS');

    expect(defaultUser.userLabel).toBe('Default User');
    expect(defaultUser.preferenceLabel).toBe('Default');
    expect(defaultUser.deviceLabel).toBe('No');
    expect(defaultUser.deliveryLabel).toBe('No');
    expect(defaultUser.dailyEnabledLabel).toBe('Default');
    expect((registered as any).token).toBeUndefined();
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
