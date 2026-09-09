import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AffiliateFeed, AffiliateProgram, AffiliateSyncRun } from '../../models/affiliate-catalog.models';
import { AffiliateCatalogService } from '../../services/affiliate-catalog.service';
import {
  AffiliateSyncRunDetailComponent,
  affiliateSyncRunDetailErrorMessage,
} from './affiliate-sync-run-detail.component';

describe('Affiliate sync run detail', () => {
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
    status: 'PARTIAL',
    programsProcessed: 1,
    feedsProcessed: 1,
    recordsRead: 1000,
    productsCreated: 10,
    productsUpdated: 20,
    variantsCreated: 30,
    variantsUpdated: 40,
    offersUpdated: 50,
    productsMissing: 2,
    errors: ['sample error'],
  };

  function configure(service: jasmine.SpyObj<AffiliateCatalogService>) {
    return TestBed.configureTestingModule({
      imports: [AffiliateSyncRunDetailComponent],
      providers: [
        provideRouter([]),
        { provide: AffiliateCatalogService, useValue: service },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: run.id }) } },
        },
      ],
    }).compileComponents();
  }

  it('loads the canonical sync run endpoint and resolves feed/program labels best-effort', async () => {
    const service = jasmine.createSpyObj<AffiliateCatalogService>('AffiliateCatalogService', [
      'getSyncRun', 'getProgram', 'getFeed',
    ]);
    service.getSyncRun.and.returnValue(of(run));
    service.getProgram.and.returnValue(of(program));
    service.getFeed.and.returnValue(of(feed));
    await configure(service);

    const fixture = TestBed.createComponent(AffiliateSyncRunDetailComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(service.getSyncRun).toHaveBeenCalledOnceWith(run.id);
    expect(service.getProgram).toHaveBeenCalledOnceWith(program.id);
    expect(service.getFeed).toHaveBeenCalledOnceWith(feed.id);
    expect(component.run).toEqual(run);
    expect(component.programName()).toBe(program.name);
    expect(component.feedName()).toBe(feed.name);
    expect(component.statusLabel()).toBe('Parziale');
  });

  it('keeps the run visible when feed/program lookups fail', async () => {
    const service = jasmine.createSpyObj<AffiliateCatalogService>('AffiliateCatalogService', [
      'getSyncRun', 'getProgram', 'getFeed',
    ]);
    service.getSyncRun.and.returnValue(of(run));
    service.getProgram.and.returnValue(throwError(() => new Error('lookup failed')));
    service.getFeed.and.returnValue(throwError(() => new Error('lookup failed')));
    await configure(service);

    const fixture = TestBed.createComponent(AffiliateSyncRunDetailComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(component.run).toEqual(run);
    expect(component.program).toBeNull();
    expect(component.feed).toBeNull();
    expect(component.programName()).toBe(run.affiliateProgramId);
    expect(component.feedName()).toBe(run.affiliateFeedId);
  });

  it('maps a missing sync run to a stable user-facing message', () => {
    expect(affiliateSyncRunDetailErrorMessage(404)).toBe('La sincronizzazione richiesta non è più disponibile.');
  });
});
