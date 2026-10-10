import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AffiliateCatalogAudit } from '../models/affiliate-catalog-audit.models';
import {
  AffiliateFeed,
  AffiliateFeedCleanupJob,
  AffiliateFeedCleanupMode,
  AffiliateProgram,
  AffiliateSyncRun,
  CatalogProduct,
  FashionEnrichmentBatch,
  FashionEnrichmentJob,
  FashionEnrichmentStatus,
  FashionOverviewResponse,
  FashionOverviewJob,
} from '../models/affiliate-catalog.models';
import {
  AffiliateApiResponse,
  AffiliateCursorPage,
  AffiliateCursorRequest,
  AffiliateFeedCreateInput,
  AffiliateFeedCreateResponse,
  AffiliateFeedDeactivationQueued,
  AffiliateFeedDeactivationReport,
  AffiliateFeedMappingResponse,
  AffiliateFeedUpdateInput,
  AffiliateProductCursorRequest,
  AffiliateProductUpdateInput,
  AffiliateProgramCreateInput,
  AffiliateProgramUpdateInput,
  AiOutfitDraft,
  AiOutfitPreviewRequest,
  AiOutfitPreviewResult,
  CatalogTaxonomyRepairResult,
  OutfitColorOption,
  OutfitStyleOption,
} from '../models/affiliate-catalog-api.models';
import { AiOutfitPublishRequest, AiOutfitPublishedResult } from '../models/ai-outfit-publish.models';
import { AiCreator, AiCreatorCreateInput, AiCreatorUpdateInput } from '../models/ai-creator.models';

@Injectable({ providedIn: 'root' })
export class AffiliateCatalogService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiBaseUrl;
  private readonly baseUrl = `${this.apiUrl}/admin/affiliate`;

  getFashionOverview(): Observable<FashionOverviewResponse> {
    return this.http.get<AffiliateApiResponse<FashionOverviewResponse>>(`${this.baseUrl}/fashion-overview`)
      .pipe(map((response) => response.data));
  }

  refreshFashionOverview(): Observable<FashionOverviewJob> {
    return this.http.post<AffiliateApiResponse<FashionOverviewJob>>(`${this.baseUrl}/fashion-overview`, {})
      .pipe(map((response) => response.data));
  }

  getFashionEnrichmentJob(): Observable<FashionEnrichmentJob | null> {
    return this.http.get<AffiliateApiResponse<FashionEnrichmentJob | null>>(`${this.baseUrl}/products/fashion-enrichment/job`)
      .pipe(map((response) => response.data));
  }

  startFashionEnrichmentJob(): Observable<FashionEnrichmentJob> {
    return this.http.post<AffiliateApiResponse<FashionEnrichmentJob>>(`${this.baseUrl}/products/fashion-enrichment/job`, {})
      .pipe(map((response) => response.data));
  }

  getFashionEnrichmentStatus(): Observable<FashionEnrichmentStatus> {
    return this.http.get<AffiliateApiResponse<FashionEnrichmentStatus>>(`${this.baseUrl}/products/fashion-enrichment`)
      .pipe(map((response) => response.data));
  }

  enrichFashionProducts(limit = 100, cursor?: string | null): Observable<FashionEnrichmentBatch> {
    return this.http.post<AffiliateApiResponse<FashionEnrichmentBatch>>(
      `${this.baseUrl}/products/fashion-enrichment`,
      { limit, ...(cursor ? { cursor } : {}) },
    ).pipe(map((response) => response.data));
  }

  getCatalogAudit(): Observable<AffiliateCatalogAudit> {
    return this.http
      .get<AffiliateApiResponse<AffiliateCatalogAudit>>(`${this.baseUrl}/catalog-audit`)
      .pipe(map((response) => response.data));
  }

  getOutfitStyles(): Observable<OutfitStyleOption[]> {
    return this.http.get<OutfitStyleOption[]>(`${this.apiUrl}/gen/outfitStyles?compact=true`);
  }

  getOutfitColors(): Observable<OutfitColorOption[]> {
    return this.http.get<OutfitColorOption[]>(`${this.apiUrl}/gen/outfitColors`);
  }

  generateOutfitPreview(input: AiOutfitPreviewRequest): Observable<AiOutfitPreviewResult> {
    return this.http
      .post<AffiliateApiResponse<AiOutfitPreviewResult>>(`${this.baseUrl}/outfit-generator/preview`, input)
      .pipe(map((response) => response.data));
  }

  getPendingOutfitDrafts(limit = 100): Observable<AiOutfitDraft[]> {
    const params = new HttpParams().set('limit', String(limit));
    return this.http
      .get<AffiliateApiResponse<AiOutfitDraft[]>>(`${this.baseUrl}/outfit-generator/drafts`, { params })
      .pipe(map((response) => response.data));
  }

  discardOutfitDraft(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/outfit-generator/drafts/${encodeURIComponent(id)}`);
  }

  publishOutfitPreview(input: AiOutfitPublishRequest): Observable<AiOutfitPublishedResult> {
    return this.http
      .post<AffiliateApiResponse<AiOutfitPublishedResult>>(`${this.baseUrl}/outfit-generator/publish`, input)
      .pipe(map((response) => response.data));
  }

  getAiCreators(): Observable<AiCreator[]> {
    return this.http
      .get<AffiliateApiResponse<AiCreator[]>>(`${this.baseUrl}/ai-creators`)
      .pipe(map((response) => response.data));
  }

  createAiCreator(input: AiCreatorCreateInput): Observable<AiCreator> {
    return this.http
      .post<AffiliateApiResponse<AiCreator>>(`${this.baseUrl}/ai-creators`, input)
      .pipe(map((response) => response.data));
  }

  updateAiCreator(uid: string, input: AiCreatorUpdateInput): Observable<AiCreator> {
    return this.http
      .put<AffiliateApiResponse<AiCreator>>(`${this.baseUrl}/ai-creators/${encodeURIComponent(uid)}`, input)
      .pipe(map((response) => response.data));
  }

  uploadAiCreatorPhoto(uid: string, photo: Blob): Observable<AiCreator> {
    return this.http
      .put<AffiliateApiResponse<AiCreator>>(
        `${this.baseUrl}/ai-creators/${encodeURIComponent(uid)}/photo`,
        photo,
        { headers: new HttpHeaders({ 'Content-Type': 'image/jpeg' }) },
      )
      .pipe(map((response) => response.data));
  }

  getPrograms(): Observable<AffiliateProgram[]> {
    return this.http
      .get<AffiliateApiResponse<AffiliateProgram[]>>(`${this.baseUrl}/programs`)
      .pipe(map((response) => response.data));
  }

  getProgram(id: string): Observable<AffiliateProgram> {
    return this.http
      .get<AffiliateApiResponse<AffiliateProgram>>(`${this.baseUrl}/programs/${id}`)
      .pipe(map((response) => response.data));
  }

  createProgram(input: AffiliateProgramCreateInput): Observable<AffiliateProgram> {
    return this.http
      .post<AffiliateApiResponse<AffiliateProgram>>(`${this.baseUrl}/programs`, input)
      .pipe(map((response) => response.data));
  }

  updateProgram(id: string, input: AffiliateProgramUpdateInput): Observable<AffiliateProgram> {
    return this.http
      .put<AffiliateApiResponse<AffiliateProgram>>(`${this.baseUrl}/programs/${id}`, input)
      .pipe(map((response) => response.data));
  }

  getFeeds(affiliateProgramId?: string): Observable<AffiliateFeed[]> {
    let params = new HttpParams();
    if (affiliateProgramId) {
      params = params.set('affiliateProgramId', affiliateProgramId);
    }

    return this.http
      .get<AffiliateApiResponse<AffiliateFeed[]>>(`${this.baseUrl}/feeds`, { params })
      .pipe(map((response) => response.data));
  }

  getFeed(id: string): Observable<AffiliateFeed> {
    return this.http
      .get<AffiliateApiResponse<AffiliateFeed>>(`${this.baseUrl}/feeds/${id}`)
      .pipe(map((response) => response.data));
  }

  createFeed(input: AffiliateFeedCreateInput): Observable<AffiliateFeedCreateResponse> {
    return this.http.post<AffiliateFeedCreateResponse>(`${this.baseUrl}/feeds`, input);
  }

  updateFeed(id: string, input: AffiliateFeedUpdateInput): Observable<AffiliateFeed> {
    return this.http
      .put<AffiliateApiResponse<AffiliateFeed>>(`${this.baseUrl}/feeds/${id}`, input)
      .pipe(map((response) => response.data));
  }

  updateFeedWithSourceValues(id: string, input: AffiliateFeedUpdateInput): Observable<AffiliateFeedMappingResponse> {
    const params = new HttpParams().set('sourceValues', 'true');
    return this.http.put<AffiliateFeedMappingResponse>(`${this.baseUrl}/feeds/${id}`, input, { params });
  }

  syncFeed(id: string): Observable<AffiliateSyncRun> {
    return this.http
      .post<AffiliateApiResponse<AffiliateSyncRun>>(`${this.baseUrl}/feeds/${id}/sync`, {})
      .pipe(map((response) => response.data));
  }

  getFeedCleanupStatus(id: string): Observable<AffiliateFeedCleanupJob | null> {
    return this.http.get<AffiliateApiResponse<AffiliateFeedCleanupJob | null>>(
      `${this.baseUrl}/feeds/${encodeURIComponent(id)}/cleanup`,
    ).pipe(map((response) => response.data));
  }

  previewFeedCleanup(id: string, mode: AffiliateFeedCleanupMode): Observable<AffiliateFeedCleanupJob> {
    return this.http.post<AffiliateApiResponse<AffiliateFeedCleanupJob>>(
      `${this.baseUrl}/feeds/${encodeURIComponent(id)}/cleanup-preview`, { mode },
    ).pipe(map((response) => response.data));
  }

  confirmFeedCleanup(
    id: string, mode: AffiliateFeedCleanupMode, previewRunId: string,
  ): Observable<AffiliateFeedCleanupJob> {
    return this.http.post<AffiliateApiResponse<AffiliateFeedCleanupJob>>(
      `${this.baseUrl}/feeds/${encodeURIComponent(id)}/cleanup-confirm`,
      { mode, previewRunId },
    ).pipe(map((response) => response.data));
  }

  deactivateFeedProductsDryRun(id: string): Observable<AffiliateFeedDeactivationReport> {
    return this.http
      .post<AffiliateApiResponse<AffiliateFeedDeactivationReport>>(
        `${this.baseUrl}/feeds/${encodeURIComponent(id)}/deactivate-products`,
        { dryRun: true },
      )
      .pipe(map((response) => response.data));
  }

  queueFeedProductDeactivation(id: string): Observable<AffiliateFeedDeactivationQueued> {
    return this.http
      .post<AffiliateApiResponse<AffiliateFeedDeactivationQueued>>(
        `${this.baseUrl}/feeds/${encodeURIComponent(id)}/deactivate-products`,
        { dryRun: false },
      )
      .pipe(map((response) => response.data));
  }

  getProducts(request?: AffiliateProductCursorRequest): Observable<AffiliateCursorPage<CatalogProduct>> {
    return this.http.get<AffiliateCursorPage<CatalogProduct>>(
      `${this.baseUrl}/products`,
      { params: this.buildProductParams(request) },
    );
  }

  getProductCategories(): Observable<string[]> {
    return this.http
      .get<AffiliateApiResponse<string[]>>(`${this.baseUrl}/product-categories`)
      .pipe(map((response) => response.data));
  }

  getProduct(id: string): Observable<CatalogProduct> {
    return this.http
      .get<AffiliateApiResponse<CatalogProduct>>(`${this.baseUrl}/products/${id}`)
      .pipe(map((response) => response.data));
  }

  updateProduct(id: string, input: AffiliateProductUpdateInput): Observable<CatalogProduct> {
    return this.http
      .put<AffiliateApiResponse<CatalogProduct>>(`${this.baseUrl}/products/${id}`, input)
      .pipe(map((response) => response.data));
  }

  repairProductTaxonomies(apply = false): Observable<CatalogTaxonomyRepairResult> {
    return this.http
      .post<AffiliateApiResponse<CatalogTaxonomyRepairResult>>(
        `${this.baseUrl}/products/taxonomy-repair`,
        { apply },
      )
      .pipe(map((response) => response.data));
  }

  getSyncRuns(request?: AffiliateCursorRequest): Observable<AffiliateCursorPage<AffiliateSyncRun>> {
    return this.http.get<AffiliateCursorPage<AffiliateSyncRun>>(
      `${this.baseUrl}/sync-runs`,
      { params: this.buildCursorParams(request) },
    );
  }

  getSyncRun(id: string): Observable<AffiliateSyncRun> {
    return this.http
      .get<AffiliateApiResponse<AffiliateSyncRun>>(`${this.baseUrl}/sync-runs/${id}`)
      .pipe(map((response) => response.data));
  }

  abortSyncRun(id: string): Observable<AffiliateSyncRun> {
    return this.http
      .post<AffiliateApiResponse<AffiliateSyncRun>>(
        `${this.baseUrl}/sync-runs/${encodeURIComponent(id)}/abort`,
        {},
      )
      .pipe(map((response) => response.data));
  }

  private buildProductParams(request?: AffiliateProductCursorRequest): HttpParams {
    let params = this.buildCursorParams(request);
    if (request?.q) {
      params = params.set('q', request.q);
    }
    if (request?.category) {
      params = params.set('category', request.category);
    }
    if (request?.affiliateProgramId) {
      params = params.set('affiliateProgramId', request.affiliateProgramId);
    }
    if (request?.visibleInApp !== undefined) {
      params = params.set('visibleInApp', String(request.visibleInApp));
    }
    return params;
  }

  private buildCursorParams(request?: AffiliateCursorRequest): HttpParams {
    let params = new HttpParams();

    if (request?.limit !== undefined) {
      params = params.set('limit', request.limit.toString());
    }
    if (request?.cursor) {
      params = params.set('cursor', request.cursor);
    }

    return params;
  }
}
