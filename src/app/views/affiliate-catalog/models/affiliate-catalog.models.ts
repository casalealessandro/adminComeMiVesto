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
  rules: string;
  rulesMapper: string;
  lastSyncAt: number | null;
  lastSuccessfulSyncAt: number | null;
  lastTotalHits: number | null;
  lastError: string | null;
  createdAt: number;
  updatedAt: number;
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
