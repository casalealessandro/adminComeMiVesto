import { buildNotificationInput } from './forms/notification-form-host.component';
import { NotificationMessage } from './models/notification.models';
import { buildNotificationColumns, buildNotificationGridRows } from './notifications.component';

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

  it('keeps edit and toggle actions in the grid', () => {
    const actions = buildNotificationColumns()[0].data
      ?.filter((column) => column.type === 'campoButton')
      .map((column) => column.button?.name);
    expect(actions).toEqual(['edit', 'toggle']);
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
