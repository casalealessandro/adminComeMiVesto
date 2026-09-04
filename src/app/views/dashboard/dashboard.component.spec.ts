import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { DashboardService, DashboardSummary } from '../../services/dashboard.service';
import { DashboardComponent } from './dashboard.component';

const summary: DashboardSummary = {
  generatedAt: 1,
  users: { total: 10, newLast7Days: 2 },
  outfits: { total: 20, approved: 15, pending: 3, newLast7Days: 4 },
  reports: { open: 2 },
  attention: { total: 5, pendingOutfits: 3, openReports: 2 },
  recentActivity: [
    { id: 'user:1', type: 'user', title: 'Mario', subtitle: 'mario@example.com', timestamp: 1 },
  ],
};

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  const dashboardService = jasmine.createSpyObj<DashboardService>('DashboardService', ['getSummary']);

  beforeEach(async () => {
    dashboardService.getSummary.and.returnValue(of(summary));

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        { provide: DashboardService, useValue: dashboardService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load the summary', () => {
    expect(component).toBeTruthy();
    expect(dashboardService.getSummary).toHaveBeenCalled();
    expect(component.summary()).toEqual(summary);
    expect(component.error()).toBeFalse();
  });

  it('should map activity types to their backoffice routes', () => {
    expect(component.activityRoute('user')).toBe('/utenti');
    expect(component.activityRoute('outfit')).toBe('/outfit-list');
    expect(component.activityRoute('report')).toBe('/reports');
  });
});
