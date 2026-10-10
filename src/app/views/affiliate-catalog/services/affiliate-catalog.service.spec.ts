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
import {
  AffiliateFeedCreateInput,
  AffiliateFeedUpdateInput,
  AffiliateProgramCreateInput,
  AffiliateProgramUpdateInput,
} from '../models/affiliate-catalog-api.models';
import { AiCreator, AiCreatorCreateInput } from '../models/ai-creator.models';
import { AffiliateCatalogService } from './affiliate-catalog.service';

describe('AffiliateCatalogService release contract', () => {
  let service: AffiliateCatalogService;
  let http: HttpTestingController;
  const baseUrl = `${environment.apiBaseUrl}/admin/affiliate`;

  const creator: AiCreator = {
    uid: 'creator-1',
    email: 'creator@example.com',
    displayName: 'Creator Test',
    nome: 'Creator',
    cognome: 'Test',
    bio: 'Virtual fashion creator',
    photoURL: 'https://example.test/avatar.jpg',
    gender: 'D',
    styleAffinity: ['C', 'SC'],
    personaPrompt: 'Look contemporanei.',
    active: true,
    createdAt: 1,
    updatedAt: 2,
  };

  const creatorCreateInput: AiCreatorCreateInput = {
    email: creator.email,
    displayName: creator.displayName,
    nome: creator.nome,
    cognome: creator.cognome,
    bio: creator.bio,
    photoURL: creator.photoURL,
    gender: creator.gender,
    styleAffinity: [...creator.styleAffinity],
    personaPrompt: creator.personaPrompt,
    active: true,
  };

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
    genderTargets: ['U', 'D'],
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

  const programCreateInput: AffiliateProgramCreateInput = {
    network: 'TRADEDOUBLER',
    networkProgramId: 'external-program-1',
    name: 'Program 1',
    networkStatus: 'ACTIVE',
    enabled: true,
    defaultAdapterType: 'TRADEDOUBLER',
    market: 'IT',
    currency: 'EUR',
    priceSegment: 'MID_RANGE',
  };

  const programUpdateInput: AffiliateProgramUpdateInput = {
    name: 'Program updated',
    enabled: false,
  };

  const feedCreateInput: AffiliateFeedCreateInput = {
    networkFeedId: 'external-feed-1',
    affiliateProgramId: program.id,
    name: 'Feed 1',
    enabled: true,
    adapterType: null,
    readMode: 'WHOLE_FEED',
    locale: 'it-IT',
    market: 'IT',
  };

  const feedUpdateInput: AffiliateFeedUpdateInput = {
    name: 'Feed updated',
    enabled: false,
    readMode: 'PAGINATED',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AffiliateCatalogService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads, creates and updates AI creators through affiliate admin endpoints', () => {
    let creators: AiCreator[] | undefined;
    service.getAiCreators().subscribe((value) => creators = value);
    const listRequest = http.expectOne(`${baseUrl}/ai-creators`);
    expect(listRequest.request.method).toBe('GET');
    listRequest.flush({ data: [creator] });
    expect(creators).toEqual([creator]);

    service.createAiCreator(creatorCreateInput).subscribe();
    const createRequest = http.expectOne(`${baseUrl}/ai-creators`);
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual(creatorCreateInput);
    createRequest.flush({ data: creator });

    service.updateAiCreator('creator/1', { active: false }).subscribe();
    const updateRequest = http.expectOne(`${baseUrl}/ai-creators/creator%2F1`);
    expect(updateRequest.request.method).toBe('PUT');
    expect(updateRequest.request.body).toEqual({ active: false });
    updateRequest.flush({ data: { ...creator, active: false } });

    service.uploadAiCreatorPhoto('creator/1', new Blob(['jpeg'], { type: 'image/jpeg' })).subscribe();
    const photoRequest = http.expectOne(`${baseUrl}/ai-creators/creator%2F1/photo`);
    expect(photoRequest.request.method).toBe('PUT');
    expect(photoRequest.request.headers.get('Content-Type')).toBe('image/jpeg');
    expect(photoRequest.request.body instanceof Blob).toBeTrue();
    photoRequest.flush({ data: { ...creator, photoURL: 'https://storage.test/profile.jpg' } });
  });

  it('fetches an AI pilot only for a specific affiliate feed', () => {
    service.getFashionAiFeedPilot('feed one').subscribe();
    const req = http.expectOne(`${baseUrl}/fashion-ai/feeds/feed%20one`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: null });
  });

  it('previews feed-specific candidate counts and a budget without requesting any AI call', () => {
    service.previewFashionAiFeedPilot('feed-1', 10, 0.10).subscribe();
    const req = http.expectOne(`${baseUrl}/fashion-ai/feeds/feed-1/preview`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ maxProducts: 10, maxBudgetUsd: 0.10 });
    req.flush({ data: { status: 'PREVIEW_READY', selectedIds: [] } });
  });

  it('sends a matching runId and acknowledged USD budget on explicit paid confirmation', () => {
    service.confirmFashionAiFeedPilot('feed-1', 'run-abc', 0.25).subscribe();
    const req = http.expectOne(`${baseUrl}/fashion-ai/feeds/feed-1/confirm`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ runId: 'run-abc', acknowledgedBudgetUsd: 0.25 });
    req.flush({ data: { status: 'QUEUED', runId: 'run-abc' } });
  });

  it('reads the cached fashion overview without scanning products or calling AI', () => {
    const status = { job: null, snapshot: null };
    let result: unknown;
    service.getFashionOverview().subscribe((data) => result = data);
    const request = http.expectOne(`${baseUrl}/fashion-overview`);
    expect(request.request.method).toBe('GET');
    expect(request.request.body).toBeNull();
    request.flush({ data: status });
    expect(result).toEqual(status);
  });

  it('requests an explicit fashion overview refresh, not a product sync or AI generation', () => {
    let started: unknown;
    service.refreshFashionOverview().subscribe((data) => started = data);
    const request = http.expectOne(`${baseUrl}/fashion-overview`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});
    request.flush({ data: { runId: 'run-1', status: 'QUEUED', scanned: 0 } });
    expect(started).toEqual({ runId: 'run-1', status: 'QUEUED', scanned: 0 });
  });

  it('uses a read-only status request before offering feed removal', () => {
    service.getFeedCleanupStatus('my feed').subscribe();
    const req = http.expectOne(`${baseUrl}/feeds/my%20feed/cleanup`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: null });
  });

  it('starts a dry-run preview, not an immediate destructive deletion', () => {
    service.previewFeedCleanup('feedA', 'PRODUCTS_ONLY').subscribe();
    const req = http.expectOne(`${baseUrl}/feeds/feedA/cleanup-preview`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ mode: 'PRODUCTS_ONLY' });
    req.flush({ data: { status: 'QUEUED', runId: 'run-preview' } });
  });

  it('sends the explicit preview id and exact cleanup mode only after confirmation', () => {
    service.confirmFeedCleanup('feedA', 'FEED_AND_PRODUCTS', 'run-preview').subscribe();
    const req = http.expectOne(`${baseUrl}/feeds/feedA/cleanup-confirm`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ mode: 'FEED_AND_PRODUCTS', previewRunId: 'run-preview' });
    req.flush({ data: { status: 'QUEUED', runId: 'run-preview' } });
  });

  it('loads programs from the configured API base and unwraps data without adding auth headers', () => {
    let response: AffiliateProgram[] | undefined;
    service.getPrograms().subscribe((value) => response = value);

    const request = http.expectOne(`${baseUrl}/programs`);
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush({ data: [program] });

    expect(response).toEqual([program]);
  });

  it('loads one program by id and unwraps data', () => {
    let response: AffiliateProgram | undefined;
    service.getProgram(program.id).subscribe((value) => response = value);

    const request = http.expectOne(`${baseUrl}/programs/${program.id}`);
    expect(request.request.method).toBe('GET');
    request.flush({ data: program });

    expect(response).toEqual(program);
  });

  it('creates a program with the exact backend DTO', () => {
    service.createProgram(programCreateInput).subscribe();

    const request = http.expectOne(`${baseUrl}/programs`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(programCreateInput);
    request.flush({ data: program });
  });

  it('updates a program with the exact backend DTO', () => {
    service.updateProgram(program.id, programUpdateInput).subscribe();

    const request = http.expectOne(`${baseUrl}/programs/${program.id}`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(programUpdateInput);
    request.flush({ data: { ...program, ...programUpdateInput } });
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

  it('loads one feed by id and unwraps data', () => {
    let response: AffiliateFeed | undefined;
    service.getFeed(feed.id).subscribe((value) => response = value);

    const request = http.expectOne(`${baseUrl}/feeds/${feed.id}`);
    expect(request.request.method).toBe('GET');
    request.flush({ data: feed });

    expect(response).toEqual(feed);
  });

  it('creates a feed with the exact backend DTO', () => {
    service.createFeed(feedCreateInput).subscribe();

    const request = http.expectOne(`${baseUrl}/feeds`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(feedCreateInput);
    request.flush({ data: feed });
  });

  it('updates a feed with the exact backend DTO', () => {
    service.updateFeed(feed.id, feedUpdateInput).subscribe();

    const request = http.expectOne(`${baseUrl}/feeds/${feed.id}`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(feedUpdateInput);
    request.flush({ data: { ...feed, ...feedUpdateInput } });
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

  it('runs a conservative feed deactivation dry-run and unwraps the impact report', () => {
    const report = {
      feedId: feed.id,
      dryRun: true,
      offersFound: 12,
      activeOffersFound: 10,
      offersDeactivated: 0,
      productsAffected: 8,
      productsToDeactivate: 6,
      productsDeactivated: 0,
      productsRemainingActive: 2,
      outfitsAffected: 3,
      outfitsTruncated: false,
      outfits: [{
        outfitId: 'outfit-1',
        title: 'Outfit 1',
        affectedCatalogProductIds: ['product-1'],
      }],
    };
    let response: unknown;

    service.deactivateFeedProductsDryRun('feed/1').subscribe((value) => response = value);

    const request = http.expectOne(`${baseUrl}/feeds/feed%2F1/deactivate-products`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ dryRun: true });
    request.flush({ data: report });

    expect(response).toEqual(report);
  });

  it('queues feed product deactivation only when explicitly requested', () => {
    let response: unknown;
    service.queueFeedProductDeactivation(feed.id).subscribe((value) => response = value);

    const request = http.expectOne(`${baseUrl}/feeds/${feed.id}/deactivate-products`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ dryRun: false });
    request.flush({
      data: {
        feedId: feed.id,
        queued: true,
      },
    });

    expect(response).toEqual({ feedId: feed.id, queued: true });
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

  it('sends the app visibility product filter when provided', () => {
    service.getProducts({ limit: 25, visibleInApp: false }).subscribe();

    const request = http.expectOne((candidate) => candidate.url === `${baseUrl}/products`);
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('limit')).toBe('25');
    expect(request.request.params.get('visibleInApp')).toBe('false');
    request.flush({ data: [], pagination: { nextCursor: null, hasMore: false } });
  });

  it('loads one product by id and unwraps data', () => {
    let response: CatalogProduct | undefined;
    service.getProduct(product.id).subscribe((value) => response = value);

    const request = http.expectOne(`${baseUrl}/products/${product.id}`);
    expect(request.request.method).toBe('GET');
    request.flush({ data: product });

    expect(response).toEqual(product);
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

  it('loads one sync run by id and unwraps data', () => {
    let response: AffiliateSyncRun | undefined;
    service.getSyncRun(syncRun.id).subscribe((value) => response = value);

    const request = http.expectOne(`${baseUrl}/sync-runs/${syncRun.id}`);
    expect(request.request.method).toBe('GET');
    request.flush({ data: syncRun });

    expect(response).toEqual(syncRun);
  });

  it('loads product categories from the affiliate catalog endpoint', () => {
    let response: string[] | undefined;
    service.getProductCategories().subscribe((value) => response = value);

    const request = http.expectOne(`${baseUrl}/product-categories`);
    expect(request.request.method).toBe('GET');
    request.flush({ data: ['Clothing', 'Shoes'] });

    expect(response).toEqual(['Clothing', 'Shoes']);
  });

  it('omits cursor pagination parameters when they are not provided', () => {
    service.getProducts().subscribe();

    const request = http.expectOne(`${baseUrl}/products`);
    expect(request.request.params.keys()).toEqual([]);
    request.flush({ data: [], pagination: { nextCursor: null, hasMore: false } });
  });
});
