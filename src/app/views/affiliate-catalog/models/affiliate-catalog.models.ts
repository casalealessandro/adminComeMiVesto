export const AFFILIATE_NETWORKS = ['TRADEDOUBLER'] as const;
export type AffiliateNetwork = typeof AFFILIATE_NETWORKS[number];

export const AFFILIATE_NETWORK_PROGRAM_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export type AffiliateNetworkProgramStatus = typeof AFFILIATE_NETWORK_PROGRAM_STATUSES[number];

export const PRICE_SEGMENTS = ['BUDGET', 'MID_RANGE', 'PREMIUM', 'LUXURY'] as const;
export type PriceSegment = typeof PRICE_SEGMENTS[number];

export const AFFILIATE_FEED_READ_MODES = ['WHOLE_FEED', 'PAGINATED'] as const;
export type AffiliateFeedReadMode = typeof AFFILIATE_FEED_READ_MODES[number];

export const AFFILIATE_SYNC_RUN_STATUSES = ['QUEUED', 'RUNNING', 'SUCCESS', 'PARTIAL', 'FAILED', 'ABORTED'] as const;
export type AffiliateSyncRunStatus = typeof AFFILIATE_SYNC_RUN_STATUSES[number];

export interface AffiliateProgram {
  id: string;
  network: AffiliateNetwork;
  networkProgramId: string;
  name: string;
  networkStatus: AffiliateNetworkProgramStatus;
  enabled: boolean;
  defaultAdapterType: string;
  market: string;
  currency: string;
  priceSegment: PriceSegment;
  createdAt: number;
  updatedAt: number;
}

export interface AffiliateFeed {
  id: string;
  networkFeedId: string;
  affiliateProgramId: string;
  name: string;
  enabled: boolean;
  adapterType: string | null;
  readMode: AffiliateFeedReadMode;
  locale: string;
  market: string;
  /** Optional Tradedoubler URL parameters appended before the token query. */
  urlParams?: string;
  /** Optional only for compatibility with API responses/documents created before feed rules. */
  rules?: string;
  /** Optional only for compatibility with API responses/documents created before feed rules. */
  rulesMapper?: string;
  lastSyncAt: number | null;
  lastSuccessfulSyncAt: number | null;
  lastTotalHits: number | null;
  lastError: string | null;
  createdAt: number;
  updatedAt: number;
}

export type AffiliateFeedCleanupMode = 'PRODUCTS_ONLY' | 'FEED_AND_PRODUCTS';
export interface AffiliateFeedCleanupImpact {
  offers: number;
  productsAffected: number;
  productsToDelete: number;
  productsPreservedForOutfits: number;
  productsPreservedForOtherFeeds: number;
  approvedOutfitsAffected: number;
  outfitExamples: { id: string; title: string }[];
}

export interface AffiliateFeedCleanupJob {
  feedId: string;
  runId: string;
  mode: AffiliateFeedCleanupMode;
  status: 'QUEUED' | 'PREVIEWING' | 'PREVIEW_READY' | 'RUNNING' | 'STOP_REQUESTED' | 'STOPPED' | 'SUCCESS' | 'FAILED';
  stage: 'PREVIEW' | 'LEGACY' | 'PRODUCTS' | 'OFFERS' | 'FINALIZE';
  cursor: string | null;
  createdAt: number;
  updatedAt: number;
  completedAt: number | null;
  previewAt: number | null;
  preview: AffiliateFeedCleanupImpact | null;
  progress: {
    productsDeleted: number;
    productsDetached: number;
    productsPreservedForOutfits: number;
    productsPreservedForOtherFeeds: number;
    variantsDeleted: number;
    offersDeleted: number;
  };
  lastError: string | null;
}

export type FashionVisionStatus = 'PREVIEW_READY' | 'QUEUED' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'STOPPED_BUDGET';
export type FashionVisionRowStatus = 'PREVIEW' | 'READY' | 'SKIPPED' | 'CONFLICT' | 'APPROVED' | 'REJECTED';
export interface FashionVisionMirror {
  category: string;
  subcategory: string;
  styles: string[];
  seasons: string[];
  fit: string;
  visualWeight: string;
}
/** AI-only explanation: styles still saved in the existing fashionProfile.styleAffinities array. */
export interface FashionVisionStyleEvidence {
  style: string;
  cue: string;
}

export interface FashionVisionReviewRow {
  productId: string;
  name: string;
  brand: string;
  image: string;
  updatedAt: number;
  before: FashionVisionMirror;
  after: FashionVisionMirror | null;
  detectedType: string;
  insideCategory: boolean | null;
  confidence: string;
  explanation: string;
  primaryStyle?: string;
  styleEvidence?: FashionVisionStyleEvidence[];
  stylePolicyVersion?: string;
  status: FashionVisionRowStatus;
  costUsd: number;
}
export interface FashionVisionDeferredPage {
  rows: Array<{
    productId: string; name: string; image: string; status: 'DEFERRED';
    decision: { detectedType: string; insideCategory: boolean; subcategoryId: string;
      styles: string[]; primaryStyle: string; confidence: string; explanation: string };
    updatedAt: number;
  }>;
  nextCursor: string | null;
}

export interface FashionVisionIssuesPage {
  rows: Array<{ productId: string; name: string; image: string;
    error: string; updatedAt: number }>;
  nextCursor: string | null;
}

export interface FashionVisionBulkJob {
  categoryId: string;
  categoryName: string;
  runId: string;
  status: 'PREVIEW_READY' | 'QUEUED' | 'RUNNING' | 'STOP_REQUESTED' |
    'STOPPED' | 'SUCCESS' | 'STOPPED_BUDGET' | 'FAILED';
  createdAt: number;
  updatedAt: number;
  cursor: string | null;
  maxBudgetEur: number;
  maxBudgetUsd: number;
  model: string;
  priceCheckedAt: string;
  stylePolicyVersion: string;
  scanned: number;
  analyzed: number;
  autoApproved: number;
  deferred: number;
  skipped: number;
  reused: number;
  conflicts: number;
  uncertainCalls: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  lastError: string | null;
}

export interface FashionVisionCategoryJob {
  runId: string;
  categoryId: string;
  categoryName: string;
  status: FashionVisionStatus;
  createdAt: number;
  previewAt: number;
  updatedAt: number;
  maxProducts: number;
  maxBudgetUsd: number;
  model: string;
  priceCheckedAt: string;
  estimatedCostUsd: number;
  estimatedGuardUsd: number;
  scanned: number;
  nextCursor: string | null;
  rows: FashionVisionReviewRow[];
  nextIndex: number;
  pendingNext: boolean;
  completed: number;
  skipped: number;
  uncertainCalls: number;
  costUsd: number;
  inputTokens: number;
  outputTokens: number;
  lastError: string | null;
}

export interface FashionAiPilotProductResult {
  productId: string;
  name: string;
  seasons: string[];
  styles: string[];
  fit: string;
  visualWeight: string;
  confidence: string;
  explanation: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  saved: boolean;
}

export interface FashionAiPilotJob {
  feedId: string;
  feedName: string;
  runId: string;
  status: 'PREVIEW_READY' | 'QUEUED' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'STOPPED_BUDGET';
  createdAt: number;
  updatedAt: number;
  previewAt: number;
  lastSyncAt: number | null;
  completedAt: number | null;
  maxProducts: number;
  maxBudgetUsd: number;
  model: string;
  priceCheckedAt: string;
  priceInputPerMillionUsd: number;
  priceOutputPerMillionUsd: number;
  estimatedCostUsd: number;
  estimatedGuardUsd: number;
  scanned: number;
  selectedIds: string[];
  previewProducts: { id: string; name: string; category: string; missing: string[] }[];
  nextIndex: number;
  pendingNext: boolean;
  completed: number;
  skipped: number;
  failed: number;
  uncertainCalls: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  results: FashionAiPilotProductResult[];
  lastError: string | null;
}

export interface FashionCoverage {
  total: number;
  active: number;
  withProfile: number;
  withSeasons: number;
  withStyles: number;
  withFit: number;
  withVisualWeight: number;
  withFeedAttributes: number;
  withImages: number;
  withoutEvidence: number;
  potentialAiCandidates: number;
}

export interface FashionCatalogExample {
  id: string;
  name: string;
  brand: string;
  seasons: string[];
  styles: string[];
  fit: string;
  evidence: string[];
  feedAttributes: string[];
  missing: string[];
  potentialAiCandidate: boolean;
}

export interface FashionMerchantOverview extends FashionCoverage {
  programId: string;
  programName: string;
  lastSuccessfulSyncAt: number | null;
  examples: FashionCatalogExample[];
  usable: FashionCoverage;
  usableExamples: FashionCatalogExample[];
}


/** Read-only additive analytics calculated by the existing asynchronous fashion snapshot job. */
export type CatalogSeason = 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER';

export interface CatalogAnalyticsCounts {
  total: number;
  active: number;
  taxonomyComplete: number;
  missingCategory: number;
  missingSubcategory: number;
  invalidCategory: number;
  invalidSubcategory: number;
  withImages: number;
  withGender: number;
  withColor: number;
  fashionV2: number;
  fashionLegacy: number;
  fashionMissing: number;
  fashionLocked: number;
  withSeasons: number;
  /** Added by newer snapshots; optional for historical analysis reports. */
  seasonCounts?: Partial<Record<CatalogSeason, number>>;
  multiSeason?: number;
  /** Added by the richer breakdown; older snapshots do not have these fields. */
  styleCounts?: Record<string, number>;
  fitCounts?: Record<string, number>;
  visualWeightCounts?: Record<string, number>;
  withFeedEvidence?: number;
  withRuleEvidence?: number;
  withStyles: number;
  withFit: number;
  withVisualWeight: number;
}
export interface CatalogAnalyticsScope {
  all: CatalogAnalyticsCounts;
  usable: CatalogAnalyticsCounts;
}
export interface CatalogAnalyticsProgram extends CatalogAnalyticsScope {
  programId: string;
  programName: string;
}
export interface CatalogAnalyticsFeed extends CatalogAnalyticsScope {
  feedId: string;
  feedName: string;
  programId: string;
  programName: string;
  enabled: boolean;
  networkActive: boolean;
  lastSuccessfulSyncAt: number | null;
  lastError: string | null;
}
export interface CatalogAnalyticsCategory extends CatalogAnalyticsScope {
  categoryId: string;
  subcategoryId: string | null;
  categoryName: string;
  subcategoryName: string | null;
  parentCategoryId: string | null;
  status: boolean | string | null;
}
export interface CatalogAnalyticsCategorySegment extends CatalogAnalyticsScope {
  sourceType: 'program' | 'feed';
  sourceId: string;
  taxonomyId: string;
}
export interface CatalogAnalytics {
  version: 1;
  total: CatalogAnalyticsScope;
  programs: CatalogAnalyticsProgram[];
  feeds: CatalogAnalyticsFeed[];
  categories: CatalogAnalyticsCategory[];
  categorySegments: CatalogAnalyticsCategorySegment[];
}

export interface FashionCatalogOverview {
  version: number;
  generatedAt: number;
  scannedProducts: number;
  summary: FashionCoverage;
  usable: FashionCoverage;
  merchants: FashionMerchantOverview[];
  analytics?: CatalogAnalytics;
}

export interface FashionOverviewJob {
  runId: string;
  status: 'QUEUED' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  scanned: number;
  startedAt: number;
  updatedAt: number;
  completedAt: number | null;
  lastError: string | null;
}

export interface FashionOverviewResponse {
  job: FashionOverviewJob | null;
  snapshot: FashionCatalogOverview | null;
}

export interface FashionProductProfile {
  version: number;
  fingerprint: string;
  seasons: string[];
  styleAffinities: string[];
  fit: string;
  visualWeight: string;
  evidence: { field: string; source: string; matched: string }[];
}

export type CatalogBrandSuspectReason = 'NO_CLEAR_GARMENT' | 'UNKNOWN_TAXONOMY';

export interface CatalogBrandSuspect {
  id: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string;
  reason: CatalogBrandSuspectReason;
  description: string;
  productType: string;
  merchantCategory: string;
  image: string | null;
}

export interface CatalogBrandSuspectsPage {
  items: CatalogBrandSuspect[];
  nextCursor: string | null;
  scanned: number;
  complete: boolean;
}

export interface CatalogReclassificationPreview {
  version: string;
  scanned: number;
  wouldUpdate: number;
  unchanged: number;
  brandFixesInSample?: number;
  brandReviewsInSample?: number;
  sampleLimit: number;
  examples: Array<{
    id: string;
    name: string;
    fields: string[];
    before: Record<string, unknown>;
    after: Record<string, unknown>;
  }>;
}

export interface FashionEnrichmentJob {
  runId: string;
  mode?: 'PROFILE_ONLY' | 'RECLASSIFY';
  expectedVersion?: string | null;
  skippedConcurrent?: number;
  brandCorrected?: number;
  brandNeedsReview?: number;
  status: 'QUEUED' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  scanned: number;
  updated: number;
  unchanged: number;
  withSeasons: number;
  withStyles: number;
  withFit: number;
  unknown: number;
  startedAt: number;
  updatedAt: number;
  completedAt: number | null;
  lastError: string | null;
}

export interface FashionEnrichmentBatch {
  scanned: number;
  updated: number;
  unchanged: number;
  withSeasons: number;
  withStyles: number;
  withFit: number;
  unknown: number;
  nextCursor: string | null;
}

export interface FashionEnrichmentStatus {
  total: number;
  enriched: number;
  examples: Array<{ id: string; name: string; brand: string; fashionProfile?: FashionProductProfile }>;
}

export interface CatalogProduct {
  id: string;
  affiliateProgramId: string;
  merchantProductGroupId: string;
  brand: string;
  name: string;
  description: string;
  genderTargets: string[];
  category: string;
  subcategory: string;
  normalizedColor: string;
  materials: string[];
  images: string[];
  sourceFeedIds: string[];
  active: boolean;
  enabledForApp?: boolean;
  classificationLocked?: boolean;
  fashionProfile?: FashionProductProfile;
  fashionProfileLocked?: boolean;
  createdAt: number;
  updatedAt: number;
  lastSeenAt: number;
}

export interface AffiliateSyncRun {
  id: string;
  affiliateProgramId: string;
  affiliateFeedId: string;
  startedAt: number;
  completedAt: number | null;
  status: AffiliateSyncRunStatus;
  programsProcessed: number;
  feedsProcessed: number;
  recordsRead: number;
  productsCreated: number;
  productsUpdated: number;
  variantsCreated: number;
  variantsUpdated: number;
  offersUpdated: number;
  productsMissing: number;
  errors: string[];
}
