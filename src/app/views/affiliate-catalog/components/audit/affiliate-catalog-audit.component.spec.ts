import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CatalogAnalytics, CatalogAnalyticsCounts } from '../../models/affiliate-catalog.models';
import { AffiliateCatalogService } from '../../services/affiliate-catalog.service';
import { AffiliateCatalogAuditComponent, auditPercentage, fashionBreakdownItems } from './affiliate-catalog-audit.component';

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

  it('lists genuine fashion values, including UNKNOWN, without inventing missing labels', () => {
    expect(fashionBreakdownItems({ CASUAL: 3, SMART_CASUAL: 2, UNKNOWN: 1 }))
      .toEqual([
        { key: 'CASUAL', label: 'Casual', count: 3 },
        { key: 'SMART_CASUAL', label: 'Smart casual', count: 2 },
        { key: 'UNKNOWN', label: 'Sconosciuto', count: 1 },
      ]);
    expect(fashionBreakdownItems(undefined)).toEqual([]);
    expect(fashionBreakdownItems({ CASUAL: 0 })).toEqual([]);
  });

  it('distinguishes legacy snapshots from complete metrics and displays missing fields', () => {
    const summary = { ...counts(7), fashionV2: 4, withStyles: 1,
      missingSubcategory: 2, invalidSubcategory: 1 };
    expect(component.hasFashionBreakdown(summary)).toBeFalse();
    expect(component.unclassifiedSubcategory(summary)).toBe(3);
    expect(component.missingFashionV2(summary, 'withStyles')).toBe(3);
    expect(component.hasFashionBreakdown({
      ...summary, seasonCounts: {}, styleCounts: {}, fitCounts: { UNKNOWN: 4 },
      visualWeightCounts: { UNKNOWN: 4 },
    })).toBeTrue();
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

  it('shows per-season counts only when the selected snapshot contains them', () => {
    component.refresh();
    expect(component.hasSeasonDistribution).toBeFalse();
    const analytics = component.overview?.snapshot?.analytics;
    if (!analytics) throw new Error('Missing report fixture');
    analytics.total.usable.seasonCounts = { SPRING: 2, AUTUMN: 1, SUMMER: 0, WINTER: 0 };
    analytics.total.usable.multiSeason = 1;
    expect(component.hasSeasonDistribution).toBeTrue();
    expect(component.seasonCount('SPRING')).toBe(2);
    component.setProgram('a');
    expect(component.hasSeasonDistribution).toBeFalse();
  });


  it('uses the selected snapshot scope for style distribution, including multiple styles and legacy reports', () => {
    fixture.detectChanges();
    expect(component.hasStyleDistribution).toBeFalse();
    expect(component.styleDistribution).toEqual([]);

    const selected: CatalogAnalytics = JSON.parse(JSON.stringify(analytics));
    selected.total.usable.styleCounts = { BUSINESS: 1, CASUAL: 2 };
    selected.total.usable.withStyles = 2;
    selected.programs[0].usable.styleCounts = { SPORTY: 3 };
    selected.feeds[0].usable.styleCounts = { SMART_CASUAL: 1, CASUAL: 2 };
    selected.feeds[0].all.styleCounts = { ELEGANT: 3 };
    component.overview = { job: null,
      snapshot: { version: 2, generatedAt: 1000, analytics: selected } as any };

    expect(component.hasStyleDistribution).toBeTrue();
    expect(component.styleDistribution.map(({ key, count }) => [key, count]))
      .toEqual([['CASUAL', 2], ['BUSINESS', 1]]);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Distribuzione per stile');
    expect(text).toContain('Senza stile riconosciuto: 1');

    component.setProgram('a');
    expect(component.styleDistribution.map(({ key }) => key)).toEqual(['SPORTY']);
    component.setFeed('f1');
    expect(component.styleDistribution.map(({ key }) => key)).toEqual(['CASUAL', 'SMART_CASUAL']);
    component.setScope('all');
    expect(component.styleDistribution.map(({ key }) => key)).toEqual(['ELEGANT']);
    component.setFeed('f2');
    expect(component.hasStyleDistribution).toBeFalse();
    expect(component.styleDistribution).toEqual([]);
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
