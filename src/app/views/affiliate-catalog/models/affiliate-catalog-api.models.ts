import {
  AffiliateFeed,
  AffiliateProgram,
  CatalogProduct,
} from './affiliate-catalog.models';

export interface AffiliateApiResponse<T> {
  data: T;
}

export interface AffiliateApiError {
  message: string;
}

export interface AffiliateProductDeleteResult {
  requested: number;
  deleted: number;
  protectedByOutfits: number;
  sharedAcrossFeeds: number;
  notFound: number;
  notEligible: number;
  deletedOffers: number;
  deletedVariants: number;
}

export interface AffiliateCursorRequest {
  limit?: number;
  cursor?: string;
}

export interface AffiliateProductCursorRequest extends AffiliateCursorRequest {
  q?: string;
  category?: string;
  subcategory?: string;
  affiliateProgramId?: string;
  visibleInApp?: boolean;
  activeOnly?: boolean;
  gender?: 'U' | 'D';
  style?: string;
  color?: string;
  season?: 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER';
}

export type AffiliateProductUpdateInput = Partial<Pick<
  CatalogProduct,
  'enabledForApp' | 'category' | 'subcategory' | 'genderTargets' | 'normalizedColor'
>> & {
  fashionProfile?: Partial<Pick<NonNullable<CatalogProduct['fashionProfile']>, 'seasons' | 'styleAffinities' | 'fit' | 'visualWeight'>>;
};

export interface AffiliateCursorPage<T> {
  data: T[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export interface CatalogTaxonomySuggestion {
  productId: string;
  productName: string;
  category: string;
  suggestedSubcategory: string;
  suggestedSubcategoryName: string;
  matchedText: string;
}

export interface CatalogTaxonomyRepairResult {
  scanned: number;
  eligible: number;
  suggested: number;
  ambiguous: number;
  noMatch: number;
  invalidCategory: number;
  updated: number;
  preview: CatalogTaxonomySuggestion[];
  previewTruncated: boolean;
}

/** Global cleanup of unclassified affiliate catalog products (not feed cleanup). */
export type AffiliateUnclassifiedCleanupStatus =
  | 'PREVIEWING' | 'PREVIEW_READY' | 'RUNNING'
  | 'STOP_REQUESTED' | 'STOPPED' | 'SUCCESS' | 'FAILED';

export interface AffiliateUnclassifiedCleanupCounters {
  scanned: number;
  unclassified: number;
  eligible: number;
  protectedManual: number;
  protectedOutfits: number;
  protectedShared: number;
  variants: number;
  offers: number;
}

export interface AffiliateUnclassifiedCleanupJob {
  runId: string;
  status: AffiliateUnclassifiedCleanupStatus;
  cursor: string | null;
  createdAt: number;
  updatedAt: number;
  completedAt: number | null;
  previewCompletedAt: number | null;
  taxonomyFingerprint: string | null;
  preview: AffiliateUnclassifiedCleanupCounters;
  deleted: {
    products: number;
    variants: number;
    offers: number;
    skippedProtected: number;
  };
  lastError: string | null;
}

export interface AffiliateFeedDeactivationOutfit {
  outfitId: string;
  title: string;
  affectedCatalogProductIds: string[];
}

export interface AffiliateFeedDeactivationReport {
  feedId: string;
  dryRun: boolean;
  offersFound: number;
  activeOffersFound: number;
  offersDeactivated: number;
  productsAffected: number;
  productsToDeactivate: number;
  productsDeactivated: number;
  productsRemainingActive: number;
  outfitsAffected: number;
  outfitsTruncated: boolean;
  outfits: AffiliateFeedDeactivationOutfit[];
}

export interface AffiliateFeedDeactivationQueued {
  feedId: string;
  queued: true;
}

export interface AffiliateFeedSourceValues {
  recordsRead: number;
  recordsNormalized: number;
  categories: string[];
  colors: string[];
  genders: string[];
}

export interface AffiliateFeedMappingResponse extends AffiliateApiResponse<AffiliateFeed> {
  sourceValues: AffiliateFeedSourceValues | null;
  sourceValuesError: string | null;
}

export type AffiliateFeedCreateResponse = AffiliateFeedMappingResponse;

export interface OutfitColorOption {
  id: string;
  value: string;
  parent?: string | null;
  hex?: string;
}

export type AiOutfitPreviewGender = 'MAN' | 'WOMAN';
export type AiOutfitPreviewSeason = 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER';
export type AiOutfitPreviewOccasion = string;
/** API preview style accepts a legacy keyword or the canonical Firestore outfitStyles document ID. */
export type AiOutfitPreviewStyle = string;

export interface OutfitStyleOption { id: string; value: string; order?: number; gender?: string[]; }

export interface AiOutfitPreviewRequest {
  gender: AiOutfitPreviewGender;
  season: AiOutfitPreviewSeason;
  occasion: AiOutfitPreviewOccasion;
  style: AiOutfitPreviewStyle;
  /** Optional for rollout compatibility; Admin sends 1-6 and backend defaults to 3 when omitted. */
  count?: number;
  /** Required catalog products. Initial version supports one outfit at a time. */
  anchorProducts?: Array<{catalogProductId: string;role: string}>;
  /** Resolve catalog product(s) by taxonomy/color on the backend before generating. */
  anchorConstraints?: Array<{role:string;category:string;subcategory:string;color?:string}>;
  /** Real Firebase UID of the managed AI creator selected for this batch. */
  creatorUid?: string;
  /** Optional maximum total price in EUR for each generated outfit. */
  maxTotalPrice?: number;
  /** Empty or omitted means all eligible feeds. */
  sourceFeedIds?: string[];
}

export interface AiOutfitTokenUsage {
  inputTokens: number;
  cachedInputTokens?: number;
  outputTokens: number;
  totalTokens: number;
}

export interface AiOutfitImageUsage extends AiOutfitTokenUsage {
  model: string;
  imagesGenerated: number;
  providerResponseIds: string[];
}

/** Nested usage fields were added after the first O.2 rollout; optional keeps deploy ordering safe. */
export interface AiOutfitPreviewUsage extends AiOutfitTokenUsage {
  stylist?: AiOutfitTokenUsage;
  imageGeneration?: AiOutfitImageUsage;
}

export interface AiOutfitPreviewProduct {
  catalogProductId: string;
  /** Added with program-balanced candidate selection; absent only during a rolling backend deployment. */
  affiliateProgramId?: string;
  role: string;
  /** Normalized tag position; optional only while frontend/backend deployments overlap. */
  x?: number;
  y?: number;
  name: string;
  brand: string;
  category: string;
  subcategory: string;
  normalizedColor: string;
  images: string[];
  price: number;
  currency: string;
  affiliateUrl: string;
  productUrl: string;
  availability: string;
}

export interface AiOutfitPreviewOutfit {
  /** Non-blocking editorial feedback from the planned backend generation. */
  editorialWarnings?: Array<'MISSING_OPTIONAL_OUTERWEAR'>;
  /** Persisted aiOutfitDrafts document ID assigned by the backend. */
  draftId?: string;
  title: string;
  description: string;
  gender: 'U' | 'D';
  season: 'E' | 'P' | 'A' | 'I';
  style: string;
  products: AiOutfitPreviewProduct[];
  previewImageUrl: string;
  creatorUid?: string;
}

export interface AiOutfitCreatorSnapshot {
  uid: string;
  displayName: string;
  photoURL: string;
  visualIdentityApplied: boolean;
}

export interface AiOutfitPreviewResult {
  generatedAt: number;
  model: string;
  providerResponseId: string | null;
  request: AiOutfitPreviewRequest;
  candidatesEvaluated: number;
  imagesEvaluated: number;
  usage: AiOutfitPreviewUsage;
  creatorSnapshot?: AiOutfitCreatorSnapshot;
  outfits: AiOutfitPreviewOutfit[];
}

export interface AiOutfitDraftEditRequest {
  expectedRevision: number;
  title: string;
  description: string;
  gender: AiOutfitPreviewOutfit['gender'];
  season: AiOutfitPreviewOutfit['season'];
  style: AiOutfitPreviewOutfit['style'];
  occasion: AiOutfitPreviewOccasion;
  products: Array<Pick<AiOutfitPreviewProduct, 'catalogProductId' | 'role' | 'x' | 'y'>>;
}

export interface AiOutfitDraft {
  id: string;
  batchId: string;
  batchIndex: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  generatedAt: number;
  createdAt: number;
  updatedAt: number;
  generatedBy: string;
  model: string;
  providerResponseId: string | null;
  request: AiOutfitPreviewRequest;
  candidatesEvaluated: number;
  imagesEvaluated: number;
  usage: AiOutfitPreviewUsage;
  creatorSnapshot?: AiOutfitCreatorSnapshot;
  outfit: AiOutfitPreviewOutfit;
  publishedOutfitId?: string;
  approvedBy?: string;
  approvedAt?: number;
  /** Optional for older persisted drafts. */
  revision?: number;
  imageNeedsRegeneration?: boolean;
  imageRegenerating?: boolean;
  imageRegenerationCount?: number;
  lastImageRegenerationUsage?: AiOutfitTokenUsage;
}

export type AffiliateProgramCreateInput = Pick<
  AffiliateProgram,
  | 'network'
  | 'networkProgramId'
  | 'name'
  | 'networkStatus'
  | 'enabled'
  | 'defaultAdapterType'
  | 'market'
  | 'currency'
  | 'priceSegment'
>;

export type AffiliateProgramUpdateInput = Partial<Pick<
  AffiliateProgram,
  | 'name'
  | 'networkStatus'
  | 'enabled'
  | 'defaultAdapterType'
  | 'market'
  | 'currency'
  | 'priceSegment'
>>;

export type AffiliateFeedCreateInput = Pick<
  AffiliateFeed,
  | 'networkFeedId'
  | 'affiliateProgramId'
  | 'name'
  | 'enabled'
  | 'locale'
  | 'market'
  | 'urlParams'
  | 'rules'
  | 'rulesMapper'
> & Partial<Pick<
  AffiliateFeed,
  | 'adapterType'
  | 'readMode'
>>;

export type AffiliateFeedUpdateInput = Partial<Pick<
  AffiliateFeed,
  | 'networkFeedId'
  | 'name'
  | 'enabled'
  | 'adapterType'
  | 'readMode'
  | 'locale'
  | 'market'
  | 'urlParams'
  | 'rules'
  | 'rulesMapper'
>>;
