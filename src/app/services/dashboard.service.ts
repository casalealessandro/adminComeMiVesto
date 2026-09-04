import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type DashboardActivityType = 'user' | 'outfit' | 'report';

export interface DashboardActivityItem {
  id: string;
  type: DashboardActivityType;
  title: string;
  subtitle: string;
  timestamp: number;
}

export interface DashboardSummary {
  generatedAt: number;
  users: {
    total: number;
    newLast7Days: number;
  };
  outfits: {
    total: number;
    approved: number;
    pending: number;
    newLast7Days: number;
  };
  reports: {
    open: number;
  };
  attention: {
    total: number;
    pendingOutfits: number;
    openReports: number;
  };
  recentActivity: DashboardActivityItem[];
}

interface DashboardSummaryEnvelope {
  message: string;
  data: DashboardSummary;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  getSummary(): Observable<DashboardSummary> {
    return this.http
      .get<DashboardSummaryEnvelope>(`${this.base}/admin/dashboard/summary`)
      .pipe(map((response) => response.data));
  }
}
