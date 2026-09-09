import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import {
  AffiliateFeed,
  AffiliateProgram,
  AffiliateSyncRun,
  CatalogProduct,
} from '../models/affiliate-catalog.models';
import { AffiliateCatalogService } from './affiliate-catalog.service';

describe('AffiliateCatalogService', () => {
  let service: AffiliateCatalogService;
  let http: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/admin/affiliate`;

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

  const product: CatalogProduct = {
    id: 'product-1',
    affiliateProgramId: program.id,
    merchantProductGroupId: 'group-1',
    brand: 'Brand',
    name: 'Product',
    description: 'Description',
    genderTargets: ['UNISEX'],
    category: 'Clothing',
    subcategory: 'Shirts',
    normalizedColor: 'BLUE',
    materials: ['Cotton'],
    images: ['https://example.test/product.jpg'],
    sourceFeedIds: [feed.id],
    active: true,
    createdAt: 1,
    updatedAt: 2,
    lastSeenAt: 3,
  };

  const syncRun: AffiliateSyncRun = {
    id: 'run-1',
    affiliateProgramId: program.id,
    affiliateFeedId: feed.id,
    startedAt: 10,
    completedAt: null,
    status: 'QUEUED',
    programsProcessed: 0,
    feedsProcessed: 0,
    recordsRead: 0,
    productsCreated: 0,
    productsUpdated: 0,
    variantsCreated: 0,
    variantsUpdated: 0,
    offersUpdated: 0,
    productsMissing: 0,
    errors: [],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AffiliateCatalogService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads programs from the configured API base and unwraps data without adding auth headers', () => {
    let response: AffiliateProgram[] | undefined;
    service.getPrograms().subscribe((value) => response = value);

    const request = http.expectOne(`${baseUrl}/programs`);
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush({ data: [program] });

    expect(response).toEqual([program]);
  });

  it('filters feeds by affiliateProgramId only when provided', () => {
    service.getFeeds(program.id).subscribe();

    const request = http.expectOne((candidate) =>
      candidate.url === `${baseUrl}/feeds`
      && candidate.params.get('affiliateProgramId') === program.id,
    );
    expect(request.request.method).toBe('GET');
    request.flush({ data: [feed] });
  });

  it('loads feeds without affiliateProgramId when the filter is absent', () => {
    service.getFeeds().subscribe();

    const request = http.expectOne(`${baseUrl}/feeds`);
    expect(request.request.params.has('affiliateProgramId')).toBeFalse();
    request.flush({ data: [feed] });
  });

  it('queues a feed synchronization and unwraps the created sync run', () => {
    let response: AffiliateSyncRun | undefined;
    service.syncFeed(feed.id).subscribe((value) => response = value);

    const request = http.expectOne(`${baseUrl}/feeds/${feed.id}/sync`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});
    request.flush({ data: syncRun });

    expect(response).toEqual(syncRun);
  });

  it('loads a cursor-based product page using only limit and cursor', () => {
    let response: unknown;
    service.getProducts({ limit: 25, cursor: 'next-product' }).subscribe((value) => response = value);

    const request = http.expectOne((candidate) => candidate.url === `${baseUrl}/products`);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('limit')).toBe('25');
    expect(request.request.params.get('cursor')).toBe('next-product');
    expect(request.request.params.keys().sort()).toEqual(['cursor', 'limit']);

    const page = {
      data: [product],
      pagination: { nextCursor: 'after-product', hasMore: true },
    };
    request.flush(page);

    expect(response).toEqual(page);
  });

  it('loads sync runs with cursor pagination and preserves the backend page envelope', () => {
    let response: unknown;
    service.getSyncRuns({ limit: 50, cursor: 'next-run' }).subscribe((value) => response = value);

    const request = http.expectOne((candidate) => candidate.url === `${baseUrl}/sync-runs`);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('limit')).toBe('50');
    expect(request.request.params.get('cursor')).toBe('next-run');

    const page = {
      data: [syncRun],
      pagination: { nextCursor: null, hasMore: false },
    };
    request.flush(page);

    expect(response).toEqual(page);
  });

  it('omits cursor pagination parameters when they are not provided', () => {
    service.getProducts().subscribe();

    const request = http.expectOne(`${baseUrl}/products`);
    expect(request.request.params.keys()).toEqual([]);
    request.flush({ data: [], pagination: { nextCursor: null, hasMore: false } });
  });
});
