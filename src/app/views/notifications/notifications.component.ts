import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { DataGridComponent } from '../../core/data-grid/data-grid.component';
import { ColData, Colonne } from '../../core/data-grid/models/data-grid.models';
import { alert, confirm } from '../../core/dialogs/ui-dialogs';
import { PopUpService } from '../../core/popup/popup.service';
import {
  NotificationFormContext,
  NotificationFormResult,
} from './forms/notification-form-host.component';
import {
  NotificationInput,
  NotificationMessage,
  NotificationRecipient,
} from './models/notification.models';
import { NotificationService } from './services/notification.service';

const baseColumn = (
  dataField: string,
  colCaption: string,
  colWidth: number | string,
  type: ColData['type'] = 'campo',
): ColData => ({
  type,
  colVisible: true,
  allowEditing: false,
  dataField,
  colWidth,
  colCaption,
  edit: false,
  groupDataField: undefined,
});

export interface NotificationGridRow extends NotificationMessage {
  typeLabel: string;
  enabledLabel: string;
  deepLinkLabel: string;
}

export interface NotificationRecipientGridRow extends NotificationRecipient {
  enabledLabel: string;
  dailyEnabledLabel: string;
  platformsLabel: string;
  preferenceLabel: string;
}

export function buildNotificationColumns(): Colonne[] {
  const columns: ColData[] = [
    baseColumn('title', 'Titolo', 220),
    baseColumn('body', 'Messaggio', 320),
    baseColumn('typeLabel', 'Tipo', 105),
    baseColumn('enabledLabel', 'Abilitata', 90),
    baseColumn('deepLinkLabel', 'Deep link', 220),
    baseColumn('updatedAt', 'Aggiornata', 140, 'campoDateTime'),
    {
      ...baseColumn('', 'Modifica', 72, 'campoButton'),
      button: {
        text: '',
        name: 'edit',
        event: 'edit',
        icon: 'mdi mdi-pencil-outline',
        hint: 'Modifica notifica',
      },
    },
    {
      ...baseColumn('', 'Stato', 72, 'campoButton'),
      button: {
        text: '',
        name: 'toggle',
        event: 'toggle',
        icon: 'mdi mdi-power',
        hint: 'Attiva o disattiva notifica',
      },
    },
    {
      ...baseColumn('', 'Invia', 72, 'campoButton'),
      button: {
        text: '',
        name: 'send',
        event: 'send',
        icon: 'mdi mdi-send-outline',
        hint: 'Invia notifica',
      },
    },
  ];

  return [{ itemType: 'group', groupDataField: '', data: columns }];
}

export function buildNotificationGridRows(notifications: NotificationMessage[]): NotificationGridRow[] {
  return notifications.map((notification) => ({
    ...notification,
    typeLabel: notification.type === 'DAILY' ? 'Giornaliera' : 'Manuale',
    enabledLabel: notification.enabled ? 'Sì' : 'No',
    deepLinkLabel: notification.deepLink || '—',
  }));
}

export function buildNotificationRecipientColumns(): Colonne[] {
  const columns: ColData[] = [
    baseColumn('displayName', 'Utente', 190),
    baseColumn('email', 'Email', 230),
    baseColumn('enabledLabel', 'Notifiche', 105),
    baseColumn('dailyEnabledLabel', 'Giornaliere', 105),
    baseColumn('platformsLabel', 'Piattaforme', 125),
    baseColumn('activeDeviceCount', 'Device', 80),
    baseColumn('preferenceLabel', 'Preferenze', 115),
    baseColumn('lastSeenAt', 'Ultimo device', 145, 'campoDateTime'),
  ];

  return [{ itemType: 'group', groupDataField: '', data: columns }];
}

export function buildNotificationRecipientRows(recipients: NotificationRecipient[]): NotificationRecipientGridRow[] {
  return recipients.map((recipient) => ({
    ...recipient,
    displayName: recipient.displayName || '—',
    email: recipient.email || '—',
    enabledLabel: recipient.enabled ? 'Attive' : 'Disattivate',
    dailyEnabledLabel: recipient.dailyEnabled ? 'Sì' : 'No',
    platformsLabel: recipient.platforms.map((platform) => platform === 'android' ? 'Android' : 'iOS').join(', ') || '—',
    preferenceLabel: recipient.preferenceConfigured ? 'Personalizzate' : 'Default',
  }));
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule, DataGridComponent],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss',
})
export class NotificationsComponent implements OnInit {
  private readonly notificationService = inject(NotificationService);
  private readonly popupService = inject(PopUpService);

  notifications: NotificationMessage[] = [];
  filteredNotifications: NotificationMessage[] = [];
  gridRows: NotificationGridRow[] = [];
  columns: Colonne[] = buildNotificationColumns();

  recipients: NotificationRecipient[] = [];
  recipientGridRows: NotificationRecipientGridRow[] = [];
  recipientColumns: Colonne[] = buildNotificationRecipientColumns();

  search = '';
  loading = false;
  recipientsLoading = false;
  changingId = '';
  sendingId = '';
  error = '';
  recipientError = '';

  get enabledRecipientCount(): number {
    return this.recipients.filter((recipient) => recipient.enabled).length;
  }

  get dailyRecipientCount(): number {
    return this.recipients.filter((recipient) => recipient.enabled && recipient.dailyEnabled).length;
  }

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.refreshNotifications();
    this.refreshRecipients();
  }

  refreshNotifications(): void {
    if (this.loading) return;
    this.loading = true;
    this.error = '';

    this.notificationService
      .getNotifications()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (notifications) => {
          this.notifications = notifications;
          this.applySearch();
        },
        error: () => {
          this.notifications = [];
          this.filteredNotifications = [];
          this.gridRows = [];
          this.error = 'Impossibile caricare le notifiche.';
        },
      });
  }

  refreshRecipients(): void {
    if (this.recipientsLoading) return;
    this.recipientsLoading = true;
    this.recipientError = '';

    this.notificationService
      .getRecipients()
      .pipe(finalize(() => this.recipientsLoading = false))
      .subscribe({
        next: (recipients) => {
          this.recipients = recipients;
          this.recipientGridRows = buildNotificationRecipientRows(recipients);
        },
        error: () => {
          this.recipients = [];
          this.recipientGridRows = [];
          this.recipientError = 'Impossibile caricare lo stato dei destinatari push.';
        },
      });
  }

  applySearch(): void {
    const term = this.search.trim().toLowerCase();
    this.filteredNotifications = !term
      ? [...this.notifications]
      : this.notifications.filter((notification) => [
          notification.title,
          notification.body,
          notification.deepLink || '',
          notification.type,
        ].some((value) => value.toLowerCase().includes(term)));

    this.gridRows = buildNotificationGridRows(this.filteredNotifications);
  }

  openCreate(): void {
    this.openForm({ mode: 'create' });
  }

  openEdit(notification: NotificationMessage): void {
    if (!notification?.id) return;
    this.openForm({ mode: 'edit', notification });
  }

  gridAction(event: { name?: string; rowData?: NotificationGridRow }): void {
    if (!event?.rowData) return;
    if (event.name === 'edit') this.openEdit(event.rowData);
    if (event.name === 'toggle') this.toggleEnabled(event.rowData);
    if (event.name === 'send') this.sendNotification(event.rowData);
  }

  toggleEnabled(notification: NotificationMessage): void {
    if (!notification?.id || this.changingId) return;
    this.changingId = notification.id;
    this.error = '';

    const input: NotificationInput = {
      title: notification.title,
      body: notification.body,
      ...(notification.deepLink ? { deepLink: notification.deepLink } : {}),
      type: notification.type,
      enabled: !notification.enabled,
    };

    this.notificationService
      .updateNotification(notification.id, input)
      .pipe(finalize(() => this.changingId = ''))
      .subscribe({
        next: (updated) => {
          this.notifications = this.notifications.map((item) => item.id === updated.id ? updated : item);
          this.applySearch();
        },
        error: () => this.error = 'Impossibile aggiornare lo stato della notifica.',
      });
  }

  sendNotification(notification: NotificationMessage): void {
    if (!notification?.id || this.sendingId) return;
    if (!notification.enabled) {
      this.error = 'Attiva la notifica prima di inviarla.';
      return;
    }

    confirm(
      `Inviare “${notification.title}” agli utenti attualmente notificabili?`,
      'Conferma invio',
      (confirmed) => {
        if (!confirmed) return;
        this.sendingId = notification.id;
        this.error = '';

        this.notificationService
          .sendNotification(notification.id)
          .pipe(finalize(() => this.sendingId = ''))
          .subscribe({
            next: (result) => {
              const invalidMessage = result.invalidDeviceCount
                ? ` ${result.invalidDeviceCount} token non più valido è stato disattivato.`
                : '';
              alert(
                `FCM ha accettato ${result.successCount} invii su ${result.deviceCount} device di ${result.recipientCount} utenti. Falliti: ${result.failureCount}.${invalidMessage}`,
                'Invio completato',
              );
              this.refreshRecipients();
            },
            error: (httpError) => {
              this.error = httpError?.status === 409
                ? 'La notifica è disattivata e non può essere inviata.'
                : 'Invio della notifica non riuscito.';
            },
          });
      },
    );
  }

  private openForm(context: NotificationFormContext): void {
    const guid = `notification-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const title = context.mode === 'edit' ? 'Modifica notifica' : 'Nuova notifica';

    this.popupService.setNewPopUp(
      guid,
      'NotificationFormHostComponent',
      context,
      720,
      undefined,
      undefined,
      false,
      true,
      title,
      'center',
      false,
    );

    void this.popupService.getOutputComponent(guid).then((result: NotificationFormResult) => {
      this.popupService.destroyCurrentOpenPopUpByGuid(guid);
      if (result?.name !== 'saved') return;
      this.refreshNotifications();
      alert(
        context.mode === 'edit' ? 'Notifica aggiornata.' : 'Notifica creata.',
        'Operazione completata',
      );
    });
  }
}
