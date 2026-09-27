import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, inject, Output } from '@angular/core';
import { finalize } from 'rxjs';
import { FORM_DEFINITION_REPOSITORY } from '../../../core/forms/contracts/form-definition-repository';
import { DynamicFormComponent } from '../../../core/forms/dynamic-form/dynamic-form.component';
import { NotificationInput, NotificationMessage, NotificationType } from '../models/notification.models';
import { FormService } from '../../../services/form.service';
import { NotificationService } from '../services/notification.service';

export type NotificationFormMode = 'create' | 'edit';

export interface NotificationFormContext {
  mode: NotificationFormMode;
  notification?: NotificationMessage;
}

export interface NotificationFormEvent {
  name: 'submitForm' | 'cancelForm';
  formData: Record<string, unknown>;
}

export interface NotificationFormResult {
  name: 'saved' | 'cancelled';
  notification?: NotificationMessage;
}

export const NOTIFICATION_FORM = 'notification-form';

const normalizedString = (value: unknown): string => String(value ?? '').trim();

export const validNotificationScheduleTime = (value: unknown): value is string =>
  typeof value === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value.trim());

export function buildNotificationInput(formData: Record<string, unknown>): NotificationInput {
  const deepLink = normalizedString(formData['deepLink']);
  const type = formData['type'] as NotificationType;
  const scheduleTime = normalizedString(formData['scheduleTime']);
  return {
    title: normalizedString(formData['title']),
    body: normalizedString(formData['body']),
    ...(deepLink ? { deepLink } : {}),
    type,
    enabled: formData['enabled'] === true,
    ...(type === 'DAILY' && scheduleTime ? { scheduleTime } : {}),
  };
}

export function notificationErrorMessage(status: number): string {
  if (status === 400) return 'Controlla i dati inseriti nella notifica.';
  if (status === 401 || status === 403) return 'Non sei autorizzato a modificare le notifiche.';
  if (status === 404) return 'La notifica non è più disponibile.';
  if (status === 0) return 'Il backend non è raggiungibile. Riprova tra poco.';
  return 'Operazione sulla notifica non riuscita.';
}

@Component({
  selector: 'app-notification-form-host',
  standalone: true,
  imports: [CommonModule, DynamicFormComponent],
  providers: [
    {
      provide: FORM_DEFINITION_REPOSITORY,
      useExisting: FormService,
    },
  ],
  templateUrl: './notification-form-host.component.html',
  styleUrl: './notification-form-host.component.scss',
})
export class NotificationFormHostComponent {
  private readonly notificationService = inject(NotificationService);

  itemData: NotificationFormContext = { mode: 'create' };
  @Output() result = new EventEmitter<NotificationFormResult>();

  saving = false;
  error = '';
  readonly formId = NOTIFICATION_FORM;
  readonly createDefaults: Partial<NotificationInput> = {
    type: 'DAILY',
    enabled: true,
  };

  handleForm(event: NotificationFormEvent): void {
    if (event.name === 'cancelForm') {
      if (!this.saving) this.result.emit({ name: 'cancelled' });
      return;
    }

    if (event.name !== 'submitForm' || this.saving) return;

    const input = buildNotificationInput(event.formData);
    if (input.type === 'DAILY' && !validNotificationScheduleTime(input.scheduleTime)) {
      this.error = 'Indica un orario valido per la notifica giornaliera.';
      return;
    }

    if (this.itemData.mode === 'edit') {
      this.updateNotification(input);
      return;
    }
    this.createNotification(input);
  }

  private createNotification(input: NotificationInput): void {
    this.saving = true;
    this.error = '';
    this.notificationService
      .createNotification(input)
      .pipe(finalize(() => this.saving = false))
      .subscribe({
        next: (notification) => this.result.emit({ name: 'saved', notification }),
        error: (error: HttpErrorResponse) => this.error = notificationErrorMessage(error.status),
      });
  }

  private updateNotification(input: NotificationInput): void {
    const notification = this.itemData.notification;
    if (!notification?.id) {
      this.error = 'Notifica non valida.';
      return;
    }

    this.saving = true;
    this.error = '';
    this.notificationService
      .updateNotification(notification.id, input)
      .pipe(finalize(() => this.saving = false))
      .subscribe({
        next: (updated) => this.result.emit({ name: 'saved', notification: updated }),
        error: (error: HttpErrorResponse) => this.error = notificationErrorMessage(error.status),
      });
  }
}
