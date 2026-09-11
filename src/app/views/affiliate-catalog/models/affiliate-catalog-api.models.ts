import {
  AffiliateFeed,
  AffiliateProgram,
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
