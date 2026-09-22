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

export interface AffiliateCursorRequest {
  limit?: number;
  cursor?: string;
}

export interface AffiliateProductCursorRequest extends AffiliateCursorRequest {
  q?: string;
  category?: string;
  affiliateProgramId?: string;
}

export type AffiliateProductUpdateInput = Partial<Pick<
  CatalogProduct,
  'enabledForApp' | 'category' | 'subcategory' | 'genderTargets' | 'normalizedColor'
>>;

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
export type AiOutfitPreviewOccasion = 'EVERYDAY' | 'OFFICE' | 'APERITIVO' | 'CEREMONY' | 'EVENING' | 'SPORT' | 'TRAVEL';
export type AiOutfitPreviewStyle = 'CASUAL' | 'BUSINESS' | 'SPORTY' | 'SMART_CASUAL' | 'ELEGANT' | 'ALTERNATIVE' | 'FESTIVAL' | 'CLASSIC' | 'TRENDY' | 'EVENING';

export interface AiOutfitPreviewRequest {
  gender: AiOutfitPreviewGender;
  season: AiOutfitPreviewSeason;
  occasion: AiOutfitPreviewOccasion;
  style: AiOutfitPreviewStyle;
  /** Optional for rollout compatibility; Admin sends 1-6 and backend defaults to 3 when omitted. */
  count?: number;
  /** Real Firebase UID of the managed AI creator selected for this batch. */
  creatorUid?: string;
  /** Optional maximum total price in EUR for each generated outfit. */
  maxTotalPrice?: number;
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
  /** Persisted aiOutfitDrafts document ID assigned by the backend. */
  draftId?: string;
  title: string;
  description: string;
  gender: 'U' | 'D';
  season: 'E' | 'P' | 'A' | 'I';
  style: 'C' | 'B' | 'SP' | 'SC' | 'E' | 'AT' | 'FES' | 'CL' | 'TR' | 'SE';
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

export interface AiOutfitDraft {
  id: string;
  batchId: string;
  batchIndex: number;
  status: 'PENDING' | 'APPROVED';
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
  | 'rules'
  | 'rulesMapper'
> & Partial<Pick<
  AffiliateFeed,
  | 'adapterType'
  | 'readMode'
>>;

export type AffiliateFeedUpdateInput = Partial<Pick<
  AffiliateFeed,
  | 'name'
  | 'enabled'
  | 'adapterType'
  | 'readMode'
  | 'locale'
  | 'market'
  | 'rules'
  | 'rulesMapper'
>>;
