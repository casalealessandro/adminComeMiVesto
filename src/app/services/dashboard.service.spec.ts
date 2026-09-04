import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { DashboardService, DashboardSummary } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(DashboardService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads and unwraps the admin dashboard summary', () => {
    const summary: DashboardSummary = {
      generatedAt: 1,
      users: { total: 10, newLast7Days: 2 },
      outfits: { total: 20, approved: 15, pending: 3, newLast7Days: 4 },
      reports: { open: 2 },
      attention: { total: 5, pendingOutfits: 3, openReports: 2 },
      recentActivity: [],
    };

    let response: DashboardSummary | undefined;
    service.getSummary().subscribe((value) => response = value);

    const request = http.expectOne(`${environment.apiBaseUrl}/admin/dashboard/summary`);
    expect(request.request.method).toBe('GET');
    request.flush({ message: 'Success', data: summary });

    expect(response).toEqual(summary);
  });
});
