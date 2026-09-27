import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  NotificationApiResponse,
  NotificationDeliveryResult,
  NotificationInput,
  NotificationMessage,
  NotificationRecipient,
} from '../models/notification.models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/admin/notifications`;

  getNotifications(): Observable<NotificationMessage[]> {
    return this.http
      .get<NotificationApiResponse<NotificationMessage[]>>(this.baseUrl)
      .pipe(map((response) => response.data));
  }

  getRecipients(): Observable<NotificationRecipient[]> {
    return this.http
      .get<NotificationApiResponse<NotificationRecipient[]>>(`${this.baseUrl}/recipients`)
      .pipe(map((response) => response.data));
  }

  getNotification(id: string): Observable<NotificationMessage> {
    return this.http
      .get<NotificationApiResponse<NotificationMessage>>(`${this.baseUrl}/${id}`)
      .pipe(map((response) => response.data));
  }

  createNotification(input: NotificationInput): Observable<NotificationMessage> {
    return this.http
      .post<NotificationApiResponse<NotificationMessage>>(this.baseUrl, input)
      .pipe(map((response) => response.data));
  }

  updateNotification(id: string, input: NotificationInput): Observable<NotificationMessage> {
    return this.http
      .put<NotificationApiResponse<NotificationMessage>>(`${this.baseUrl}/${id}`, input)
      .pipe(map((response) => response.data));
  }

  sendNotification(id: string): Observable<NotificationDeliveryResult> {
    return this.http
      .post<NotificationApiResponse<NotificationDeliveryResult>>(`${this.baseUrl}/${id}/send`, {})
      .pipe(map((response) => response.data));
  }
}
