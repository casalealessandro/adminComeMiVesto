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
  CatalogReclassificationPreview,
  CatalogBrandSuspectsPage,
  FashionEnrichmentStatus,
  FashionOverviewResponse,
  FashionOverviewJob,
  FashionAiPilotJob, FashionVisionCategoryJob, FashionVisionBulkJob, FashionVisionDeferredPage,
  FashionVisionIssuesPage,
} from '../models/affiliate-catalog.models';
import {
  AffiliateApiResponse,
  AffiliateProductDeleteResult,
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
  AiOutfitDraftEditRequest,
  AiOutfitPreviewRequest,
  AiOutfitPreviewResult,
  CatalogTaxonomyRepairResult,
  AffiliateUnclassifiedCleanupJob,
  OutfitColorOption,
  OutfitStyleOption,
} from '../models/affiliate-catalog-api.models';
import type { OutfitOccasion } from '../../../services/taxonomy.service';
import { AiOutfitPublishRequest, AiOutfitPublishedResult } from '../models/ai-outfit-publish.models';
import { AiCreator, AiCreatorCreateInput, AiCreatorUpdateInput } from '../models/ai-creator.models';


export type AffiliateMappingRuleType = 'CATEGORY' | 'COLOR' | 'GENDER' | 'SEASON' | 'STYLE' | 'FIT' | 'MATERIAL';
export interface AffiliateMappingRule {
  id: string;
  type: AffiliateMappingRuleType;
  label: string;
  aliases: string[];
  enabled: boolean;
  data: Record<string, unknown>;
  note?: string;
  origin?: 'BUILTIN' | 'CUSTOM';
}

@Injectable({ providedIn: 'root' })
export class AffiliateCatalogService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiBaseUrl;
  private readonly baseUrl = `${this.apiUrl}/admin/affiliate`;


  seedMappingRules(): Observable<{ total: number; created: number; existing: number }> {
    return this.http.post<AffiliateApiResponse<{ total: number; created: number; existing: number }>>(
      `${this.baseUrl}/mapping-rules/seed`, {},
    ).pipe(map(response => response.data));
  }

  getMappingRules(): Observable<AffiliateMappingRule[]> {
    return this.http.get<AffiliateApiResponse<AffiliateMappingRule[]>>(`${this.baseUrl}/mapping-rules`)
      .pipe(map(response => response.data));
  }

  saveMappingRule(rule: AffiliateMappingRule): Observable<AffiliateMappingRule> {
    const { id, type, label, aliases, enabled, data, note } = rule;
    return this.http.put<AffiliateApiResponse<AffiliateMappingRule>>(
      `${this.baseUrl}/mapping-rules/${encodeURIComponent(id)}`,
      { type, label, aliases, enabled, data, note: note ?? '' },
    ).pipe(map(response => response.data));
  }

  disableMappingRule(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/mapping-rules/${encodeURIComponent(id)}`);
  }

  getFashionVisionBulk(categoryId: string): Observable<FashionVisionBulkJob | null> {
    return this.http.get<AffiliateApiResponse<FashionVisionBulkJob | null>>(
      this.baseUrl + '/fashion-ai/categories/' + encodeURIComponent(categoryId) + '/bulk',
    ).pipe(map(response => response.data));
  }

  getFashionVisionBulkDeferred(categoryId: string, after?: string): Observable<FashionVisionDeferredPage> {
    return this.http.get<AffiliateApiResponse<FashionVisionDeferredPage>>(
      this.baseUrl + '/fashion-ai/categories/' + encodeURIComponent(categoryId) + '/bulk/deferred',
      { params: after ? new HttpParams().set('after', after) : undefined },
    ).pipe(map(response => response.data));
  }

  getFashionVisionBulkIssues(categoryId: string, after?: string): Observable<FashionVisionIssuesPage> {
    return this.http.get<AffiliateApiResponse<FashionVisionIssuesPage>>(
      this.baseUrl + '/fashion-ai/categories/' + encodeURIComponent(categoryId) + '/bulk/issues',
      { params: after ? new HttpParams().set('after', after) : undefined },
    ).pipe(map(response => response.data));
  }

  resumeFashionVisionBulk(categoryId: string, runId: string): Observable<FashionVisionBulkJob> {
    return this.http.post<AffiliateApiResponse<FashionVisionBulkJob>>(
      this.baseUrl + '/fashion-ai/categories/' + encodeURIComponent(categoryId) + '/bulk/resume',
      { runId },
    ).pipe(map(response => response.data));
  }

  prepareFashionVisionBulk(categoryId: string): Observable<FashionVisionBulkJob> {
    return this.http.post<AffiliateApiResponse<FashionVisionBulkJob>>(
      this.baseUrl + '/fashion-ai/categories/' + encodeURIComponent(categoryId) + '/bulk/preview',
      {},
    ).pipe(map(response => response.data));
  }

  confirmFashionVisionBulk(categoryId: string, runId: string): Observable<FashionVisionBulkJob> {
    return this.http.post<AffiliateApiResponse<FashionVisionBulkJob>>(
      this.baseUrl + '/fashion-ai/categories/' + encodeURIComponent(categoryId) + '/bulk/confirm',
      { runId, acknowledgedBudgetEur: 10 },
    ).pipe(map(response => response.data));
  }

  stopFashionVisionBulk(categoryId: string, runId: string): Observable<FashionVisionBulkJob> {
    return this.http.post<AffiliateApiResponse<FashionVisionBulkJob>>(
      this.baseUrl + '/fashion-ai/categories/' + encodeURIComponent(categoryId) + '/bulk/stop',
      { runId },
    ).pipe(map(response => response.data));
  }

  getFashionVisionCategory(categoryId: string): Observable<FashionVisionCategoryJob | null> {
    return this.http.get<AffiliateApiResponse<FashionVisionCategoryJob | null>>(
      this.baseUrl + '/fashion-ai/categories/' + encodeURIComponent(categoryId),
    ).pipe(map(response => response.data));
  }

  previewFashionVisionCategory(
    categoryId: string, maxProducts: number, maxBudgetUsd: number, after?: string,
  ): Observable<FashionVisionCategoryJob> {
    return this.http.post<AffiliateApiResponse<FashionVisionCategoryJob>>(
      this.baseUrl + '/fashion-ai/categories/' + encodeURIComponent(categoryId) + '/preview',
      { maxProducts, maxBudgetUsd, ...(after ? { after } : {}) },
    ).pipe(map(response => response.data));
  }

  confirmFashionVisionCategory(
    categoryId: string, runId: string, acknowledgedBudgetUsd: number,
  ): Observable<FashionVisionCategoryJob> {
    return this.http.post<AffiliateApiResponse<FashionVisionCategoryJob>>(
      this.baseUrl + '/fashion-ai/categories/' + encodeURIComponent(categoryId) + '/confirm',
      { runId, acknowledgedBudgetUsd },
    ).pipe(map(response => response.data));
  }

  reviewFashionVisionProduct(
    categoryId: string,
    input: { runId: string; productId: string; action: 'APPROVE' | 'REJECT'; styles?: string[]; category?: string; subcategory?: string; seasons?: string[] },
  ): Observable<FashionVisionCategoryJob> {
    return this.http.post<AffiliateApiResponse<FashionVisionCategoryJob>>(
      this.baseUrl + '/fashion-ai/categories/' + encodeURIComponent(categoryId) + '/review',
      input,
    ).pipe(map(response => response.data));
  }

  getFashionAiFeedPilot(feedId: string): Observable<FashionAiPilotJob | null> {
    return this.http.get<AffiliateApiResponse<FashionAiPilotJob | null>>(
      `${this.baseUrl}/fashion-ai/feeds/${encodeURIComponent(feedId)}`,
    ).pipe(map((response) => response.data));
  }

  previewFashionAiFeedPilot(
    feedId: string, maxProducts: number, maxBudgetUsd: number,
  ): Observable<FashionAiPilotJob> {
    return this.http.post<AffiliateApiResponse<FashionAiPilotJob>>(
      `${this.baseUrl}/fashion-ai/feeds/${encodeURIComponent(feedId)}/preview`,
      { maxProducts, maxBudgetUsd },
    ).pipe(map((response) => response.data));
  }

  confirmFashionAiFeedPilot(
    feedId: string, runId: string, acknowledgedBudgetUsd: number,
  ): Observable<FashionAiPilotJob> {
    return this.http.post<AffiliateApiResponse<FashionAiPilotJob>>(
      `${this.baseUrl}/fashion-ai/feeds/${encodeURIComponent(feedId)}/confirm`,
      { runId, acknowledgedBudgetUsd },
    ).pipe(map((response) => response.data));
  }

  getFashionOverview(): Observable<FashionOverviewResponse> {
    return this.http.get<AffiliateApiResponse<FashionOverviewResponse>>(`${this.baseUrl}/fashion-overview`)
      .pipe(map((response) => response.data));
  }

  refreshFashionOverview(): Observable<FashionOverviewJob> {
    return this.http.post<AffiliateApiResponse<FashionOverviewJob>>(`${this.baseUrl}/fashion-overview`, {})
      .pipe(map((response) => response.data));
  }

  previewCatalogReclassification(): Observable<CatalogReclassificationPreview> {
    return this.http.post<AffiliateApiResponse<CatalogReclassificationPreview>>(
      this.baseUrl + '/products/reclassification/preview', {},
    ).pipe(map(response => response.data));
  }

  getBrandCategorySuspects(cursor?: string, limit = 25): Observable<CatalogBrandSuspectsPage> {
    let params = new HttpParams().set('limit', String(limit));
    if (cursor) params = params.set('cursor', cursor);
    return this.http.get<AffiliateApiResponse<CatalogBrandSuspectsPage>>(
      this.baseUrl + '/products/reclassification/suspects', { params },
    ).pipe(map(response => response.data));
  }

  /** A dedicated endpoint revalidates REVIEW eligibility at deletion time. */
  deleteSelectedBrandSuspects(productIds: string[]): Observable<AffiliateProductDeleteResult> {
    return this.http.post<AffiliateApiResponse<AffiliateProductDeleteResult>>(
      this.baseUrl + '/products/reclassification/suspects/delete-selected', { productIds },
    ).pipe(map(response => response.data));
  }

  getCatalogReclassificationJob(): Observable<FashionEnrichmentJob | null> {
    return this.http.get<AffiliateApiResponse<FashionEnrichmentJob | null>>(
      this.baseUrl + '/products/reclassification/job',
    ).pipe(map(response => response.data));
  }

  startCatalogReclassification(expectedVersion: string): Observable<FashionEnrichmentJob> {
    return this.http.post<AffiliateApiResponse<FashionEnrichmentJob>>(
      this.baseUrl + '/products/reclassification/job', { expectedVersion },
    ).pipe(map(response => response.data));
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

  getOutfitOccasions(): Observable<OutfitOccasion[]> {
    return this.http.get<OutfitOccasion[]>(`${this.apiUrl}/gen/outfitOccasions`);
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

  updateOutfitDraft(id: string, input: AiOutfitDraftEditRequest): Observable<AiOutfitDraft> {
    return this.http
      .put<AffiliateApiResponse<AiOutfitDraft>>(`${this.baseUrl}/outfit-generator/drafts/${encodeURIComponent(id)}`, input)
      .pipe(map((response) => response.data));
  }

  regenerateOutfitDraftImage(id: string, expectedRevision: number): Observable<AiOutfitDraft> {
    return this.http
      .post<AffiliateApiResponse<AiOutfitDraft>>(
        `${this.baseUrl}/outfit-generator/drafts/${encodeURIComponent(id)}/regenerate-image`,
        { expectedRevision },
      )
      .pipe(map((response) => response.data));
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

  getFeedCleanupJobs(): Observable<AffiliateFeedCleanupJob[]> {
    return this.http.get<AffiliateApiResponse<AffiliateFeedCleanupJob[]>>(
      `${this.baseUrl}/feed-cleanup-jobs`,
    ).pipe(map((response) => response.data));
  }

  getFeedCleanupStatus(id: string): Observable<AffiliateFeedCleanupJob | null> {
    return this.http.get<AffiliateApiResponse<AffiliateFeedCleanupJob | null>>(
      `${this.baseUrl}/feeds/${encodeURIComponent(id)}/cleanup`,
    ).pipe(map((response) => response.data));
  }

  stopFeedCleanup(id: string, runId: string): Observable<AffiliateFeedCleanupJob> {
    return this.http.post<AffiliateApiResponse<AffiliateFeedCleanupJob>>(
      `${this.baseUrl}/feeds/${encodeURIComponent(id)}/cleanup-stop`, { runId },
    ).pipe(map((response) => response.data));
  }

  startFeedProductsCleanup(id: string): Observable<AffiliateFeedCleanupJob> {
    return this.http.post<AffiliateApiResponse<AffiliateFeedCleanupJob>>(
      `${this.baseUrl}/feeds/${encodeURIComponent(id)}/cleanup-products`, {},
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

  getCurationCategories(parentId?: string): Observable<Array<{ id: string; categoryName: string }>> {
    const path = parentId ? `/gen/outfitCategories/${encodeURIComponent(parentId)}` : '/gen/outfitCategories';
    return this.http.get<AffiliateApiResponse<Array<{ id: string; categoryName: string }>> | Array<{ id: string; categoryName: string }>>(
      `${this.apiUrl}${path}`,
    ).pipe(map(response => Array.isArray(response) ? response : response.data));
  }

  getProductSubcategories(): Observable<string[]> {
    return this.http
      .get<AffiliateApiResponse<string[]>>(`${this.baseUrl}/product-subcategories`)
      .pipe(map((response) => response.data));
  }

  getProductCategories(): Observable<string[]> {
    return this.http
      .get<AffiliateApiResponse<string[]>>(`${this.baseUrl}/product-categories`)
      .pipe(map((response) => response.data));
  }

  deleteSelectedProducts(productIds: string[]): Observable<AffiliateProductDeleteResult> {
    return this.http.post<AffiliateApiResponse<AffiliateProductDeleteResult>>(
      `${this.baseUrl}/products/delete-selected`, { productIds },
    ).pipe(map(response => response.data));
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

  getUnclassifiedCleanupStatus(): Observable<AffiliateUnclassifiedCleanupJob | null> {
    return this.http
      .get<AffiliateApiResponse<AffiliateUnclassifiedCleanupJob | null>>(
        `${this.baseUrl}/catalog-unclassified-cleanup`,
      )
      .pipe(map((response) => response.data));
  }

  previewUnclassifiedCleanup(): Observable<AffiliateUnclassifiedCleanupJob> {
    return this.http
      .post<AffiliateApiResponse<AffiliateUnclassifiedCleanupJob>>(
        `${this.baseUrl}/catalog-unclassified-cleanup/preview`, {},
      )
      .pipe(map((response) => response.data));
  }

  confirmUnclassifiedCleanup(runId: string): Observable<AffiliateUnclassifiedCleanupJob> {
    return this.http
      .post<AffiliateApiResponse<AffiliateUnclassifiedCleanupJob>>(
        `${this.baseUrl}/catalog-unclassified-cleanup/confirm`, { runId },
      )
      .pipe(map((response) => response.data));
  }

  stopUnclassifiedCleanup(runId: string): Observable<AffiliateUnclassifiedCleanupJob> {
    return this.http
      .post<AffiliateApiResponse<AffiliateUnclassifiedCleanupJob>>(
        `${this.baseUrl}/catalog-unclassified-cleanup/stop`, { runId },
      )
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
    if (request?.subcategory) {
      params = params.set('subcategory', request.subcategory);
    }
    if (request?.season) {
      params = params.set('season', request.season);
    }
    if (request?.affiliateProgramId) {
      params = params.set('affiliateProgramId', request.affiliateProgramId);
    }
    if (request?.visibleInApp !== undefined) {
      params = params.set('visibleInApp', String(request.visibleInApp));
    }
    if (request?.activeOnly !== undefined) {
      params = params.set('activeOnly', String(request.activeOnly));
    }
    if (request?.gender) {
      params = params.set('gender', request.gender);
    }
    if (request?.style) {
      params = params.set('style', request.style);
    }
    if (request?.color) {
      params = params.set('color', request.color);
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
