import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CatalogAnalytics, CatalogAnalyticsCounts } from '../../models/affiliate-catalog.models';
import { AffiliateCatalogService } from '../../services/affiliate-catalog.service';
import { AffiliateCatalogAuditComponent, auditPercentage } from './affiliate-catalog-audit.component';

const counts = (total: number): CatalogAnalyticsCounts => ({
  total, active: total, taxonomyComplete: total, missingCategory: 0,
  missingSubcategory: 0, invalidCategory: 0, invalidSubcategory: 0,
  withImages: total, withGender: total, withColor: total,
  fashionV2: total, fashionLegacy: 0, fashionMissing: 0, fashionLocked: 0,
  withSeasons: total, withStyles: total, withFit: total, withVisualWeight: total,
});
const scope = (all: number, usable: number) => ({ all: counts(all), usable: counts(usable) });
const analytics: CatalogAnalytics = {
  version: 1, total: scope(5, 3),
  programs: [{ programId: 'a', programName: 'Merchant A', ...scope(4, 3) }],
  feeds: [
    { feedId: 'f1', feedName: 'Feed A', programId: 'a', programName: 'Merchant A',
      enabled: true, networkActive: true, lastSuccessfulSyncAt: 900, lastError: null, ...scope(3, 2) },
    { feedId: 'f2', feedName: 'Feed B', programId: 'a', programName: 'Merchant A',
      enabled: false, networkActive: true, lastSuccessfulSyncAt: 800, lastError: null, ...scope(2, 0) },
  ],
  categories: [
    { categoryId: 'trousers', subcategoryId: null, categoryName: 'Pantaloni',
      subcategoryName: null, parentCategoryId: null, status: true, ...scope(4, 3) },
    { categoryId: 'trousers', subcategoryId: 'palazzo', categoryName: 'Pantaloni',
      subcategoryName: 'Palazzo', parentCategoryId: 'trousers', status: true, ...scope(2, 1) },
  ],
  categorySegments: [
    { sourceType: 'program', sourceId: 'a', taxonomyId: 'trousers', ...scope(3, 2) },
    { sourceType: 'feed', sourceId: 'f1', taxonomyId: 'trousers', ...scope(2, 1) },
    { sourceType: 'feed', sourceId: 'f1', taxonomyId: 'palazzo', ...scope(1, 1) },
  ],
};

describe('AffiliateCatalogAuditComponent', () => {
  it('calculates bounded percentages safely', () => {
    expect(auditPercentage(8, 10)).toBe(80);
    expect(auditPercentage(1, 0)).toBe(0);
    expect(auditPercentage(20, 10)).toBe(100);
  });

  let fixture: ComponentFixture<AffiliateCatalogAuditComponent>;
  let component: AffiliateCatalogAuditComponent;
  let service: jasmine.SpyObj<AffiliateCatalogService>;

  beforeEach(async () => {
    service = jasmine.createSpyObj<AffiliateCatalogService>('AffiliateCatalogService', ['getFashionOverview', 'refreshFashionOverview']);
    service.getFashionOverview.and.returnValue(of({ job: null,
      snapshot: { version: 2, generatedAt: 1000, analytics } as any }));

    await TestBed.configureTestingModule({
      imports: [AffiliateCatalogAuditComponent],
      providers: [provideRouter([]), { provide: AffiliateCatalogService, useValue: service }],
    }).compileComponents();
    fixture = TestBed.createComponent(AffiliateCatalogAuditComponent);
    component = fixture.componentInstance;
  });

  it('loads a cached snapshot without calling the expensive catalog audit scan', () => {
    fixture.detectChanges();
    expect(service.getFashionOverview).toHaveBeenCalledTimes(1);
    expect(component.counts.total).toBe(3);
    expect(component.categoryCounts(component.categories[0]).total).toBe(3);
  });

  it('filters counts and category intersections by feed and program', () => {
    component.refresh();
    component.setProgram('a');
    expect(component.counts.total).toBe(3);
    expect(component.categoryCounts(component.categories[0]).total).toBe(2);
    component.setFeed('f1');
    expect(component.counts.total).toBe(2);
    expect(component.categoryCounts(component.categories[0]).total).toBe(1);
    expect(component.categoryCounts(component.childrenFor('trousers')[0]).total).toBe(1);
    component.setScope('all');
    expect(component.counts.total).toBe(3);
    expect(component.categoryCounts(component.categories[0]).total).toBe(2);
    component.setProgram('');
    expect(component.selectedFeedId).toBe('');
    expect(component.counts.total).toBe(5);
  });

  it('starts an explicitly requested background refresh without OpenAI', () => {
    service.refreshFashionOverview.and.returnValue(of({ runId: 'r1', status: 'QUEUED',
      scanned: 0, startedAt: 1, updatedAt: 1, completedAt: null, lastError: null }));
    component.recalculate();
    expect(service.refreshFashionOverview).toHaveBeenCalledTimes(1);
    expect(component.jobRunning).toBeTrue();
  });

  it('shows error without inventing data on API failure', () => {
    service.getFashionOverview.and.returnValue(throwError(() => new Error('failed')));
    component.refresh();
    expect(component.report).toBeNull();
    expect(component.error).toContain('Impossibile');
  });
});
