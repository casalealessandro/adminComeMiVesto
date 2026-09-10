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

export interface AffiliateCursorPage<T> {
  data: T[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
  };
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
