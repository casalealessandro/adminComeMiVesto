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
}

export interface FashionCatalogOverview {
  version: number;
  generatedAt: number;
  scannedProducts: number;
  summary: FashionCoverage;
  merchants: FashionMerchantOverview[];
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

export interface FashionEnrichmentJob {
  runId: string;
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
