import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AffiliateFeed, AffiliateProgram, AffiliateSyncRun } from '../../models/affiliate-catalog.models';
import { AffiliateCatalogService } from '../../services/affiliate-catalog.service';
import {
  AFFILIATE_SYNC_RUNS_PAGE_SIZE,
  AffiliateSyncRunsComponent,
  affiliateSyncStatusLabel,
  buildAffiliateSyncRunColumns,
  buildAffiliateSyncRunGridRows,
} from './affiliate-sync-runs.component';

describe('Affiliate sync runs', () => {
  const program: AffiliateProgram = {
    id: 'program-1',
    network: 'TRADEDOUBLER',
    networkProgramId: 'external-program-1',
    name: 'Program 1',
    networkStatus: 'ACTIVE',
    enabled: true,
    defaultAdapterType: 'TRADEDOUBLER',
    market: 'IT',
    currency: 'EUR',
    priceSegment: 'MID_RANGE',
    createdAt: 1,
    updatedAt: 2,
  };

  const feed: AffiliateFeed = {
    id: 'feed-1',
    networkFeedId: 'external-feed-1',
    affiliateProgramId: program.id,
    name: 'Feed 1',
    enabled: true,
    adapterType: null,
    readMode: 'WHOLE_FEED',
    locale: 'it-IT',
    market: 'IT',
    lastSyncAt: null,
    lastSuccessfulSyncAt: null,
    lastTotalHits: null,
    lastError: null,
    createdAt: 1,
    updatedAt: 2,
  };

  const run: AffiliateSyncRun = {
    id: 'run-1',
    affiliateProgramId: program.id,
    affiliateFeedId: feed.id,
    startedAt: 100,
    completedAt: 200,
    status: 'SUCCESS',
    programsProcessed: 1,
    feedsProcessed: 1,
    recordsRead: 1000,
    productsCreated: 10,
    productsUpdated: 20,
    variantsCreated: 30,
    variantsUpdated: 40,
    offersUpdated: 50,
    productsMissing: 2,
    errors: ['sample'],
  };

  it('keeps the sync runs grid read-only and free from action columns', () => {
    const columns = buildAffiliateSyncRunColumns()[0].data;

    expect(columns.some((column) => column.type === 'campoButton')).toBeFalse();
    expect(columns.every((column) => column.allowEditing === false)).toBeTrue();
  });

  it('maps backend statuses to readable labels', () => {
    expect(affiliateSyncStatusLabel('QUEUED')).toBe('In coda');
    expect(affiliateSyncStatusLabel('RUNNING')).toBe('In esecuzione');
    expect(affiliateSyncStatusLabel('SUCCESS')).toBe('Completata');
    expect(affiliateSyncStatusLabel('PARTIAL')).toBe('Parziale');
    expect(affiliateSyncStatusLabel('FAILED')).toBe('Fallita');
    expect(affiliateSyncStatusLabel('ABORTED')).toBe('Interrotta');
  });

  it('maps program, feed and counters to display-only rows', () => {
    const rows = buildAffiliateSyncRunGridRows(
      [run],
      new Map([[program.id, program.name]]),
      new Map([[feed.id, feed.name]]),
    );

    expect(rows[0].programName).toBe(program.name);
    expect(rows[0].feedName).toBe(feed.name);
    expect(rows[0].statusLabel).toBe('Completata');
    expect(rows[0].productsLabel).toBe('10 / 20');
    expect(rows[0].variantsLabel).toBe('30 / 40');
    expect(rows[0].errorsCount).toBe(1);
  });

  it('falls back to canonical ids when lookups are unavailable', () => {
    const rows = buildAffiliateSyncRunGridRows([run], new Map(), new Map());
    expect(rows[0].programName).toBe(program.id);
    expect(rows[0].feedName).toBe(feed.id);
  });

  describe('cursor pagination', () => {
    let fixture: ComponentFixture<AffiliateSyncRunsComponent>;
    let component: AffiliateSyncRunsComponent;
    let service: jasmine.SpyObj<AffiliateCatalogService>;

    beforeEach(async () => {
      service = jasmine.createSpyObj<AffiliateCatalogService>('AffiliateCatalogService', [
        'getSyncRuns',
        'getPrograms',
        'getFeeds',
      ]);
      service.getPrograms.and.returnValue(of([program]));
      service.getFeeds.and.returnValue(of([feed]));
      service.getSyncRuns.and.returnValues(
        of({
          data: [run],
          pagination: { nextCursor: 'cursor-2', hasMore: true },
        }),
        of({
          data: [{ ...run, id: 'run-2', status: 'PARTIAL' }],
          pagination: { nextCursor: null, hasMore: false },
        }),
      );

      await TestBed.configureTestingModule({
        imports: [AffiliateSyncRunsComponent],
        providers: [
          { provide: AffiliateCatalogService, useValue: service },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(AffiliateSyncRunsComponent);
      component = fixture.componentInstance;
    });

    it('loads the first backend page with the canonical page size', () => {
      component.refresh();

      expect(service.getSyncRuns).toHaveBeenCalledOnceWith({
        limit: AFFILIATE_SYNC_RUNS_PAGE_SIZE,
      });
      expect(component.runs.length).toBe(1);
      expect(component.hasMore).toBeTrue();
      expect(component.nextCursor).toBe('cursor-2');
    });

    it('uses only the opaque nextCursor when loading the next page', () => {
      component.refresh();
      component.loadMore();

      expect(service.getSyncRuns.calls.argsFor(1)).toEqual([{
        limit: AFFILIATE_SYNC_RUNS_PAGE_SIZE,
        cursor: 'cursor-2',
      }]);
      expect(component.runs.map((item) => item.id)).toEqual(['run-1', 'run-2']);
      expect(component.hasMore).toBeFalse();
      expect(component.nextCursor).toBeNull();
    });
  });
});
