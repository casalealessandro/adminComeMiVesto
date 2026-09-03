import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type ReportStatus = 'pending' | 'resolved' | 'dismissed';
export type ReportResolution = 'content_removed' | 'user_disabled' | 'other' | 'no_violation';
export interface Report {
  id: string;
  typeSegnaletion?: string;
  reason?: string;
  outFitId?: string;
  outfitUserId?: string;
  userIdSegnalation?: string;
  status: ReportStatus;
  resolution?: ReportResolution;
  createdAt?: string | number;
  resolvedAt?: string | number;
  resolvedBy?: string;
}

export function buildReportUpdate(status: ReportStatus, resolution?: ReportResolution): { status: ReportStatus; resolution?: ReportResolution } {
  if (status === 'pending') return { status };
  if (status === 'dismissed') return { status, resolution: 'no_violation' };
  if (!resolution) throw new Error('La resolution è obbligatoria per un report risolto.');
  return { status, resolution };
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/gen/reports`;
  list(): Observable<Report[]> { return this.http.get<any>(this.base).pipe(map(response => response.data || response || [])); }
  detail(id: string): Observable<Report> { return this.http.get<any>(`${this.base}/${encodeURIComponent(id)}`).pipe(map(response => response.data || response)); }
  update(id: string, status: ReportStatus, resolution?: ReportResolution): Observable<unknown> {
    return this.http.put(`${this.base}/${encodeURIComponent(id)}`, buildReportUpdate(status, resolution));
  }
  delete(id: string): Observable<unknown> { return this.http.delete(`${this.base}/${encodeURIComponent(id)}`); }
}
