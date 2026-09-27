import {
  affiliateFeedSyncEligibility,
  affiliateFeedSyncErrorMessage,
  buildAffiliateFeedColumns,
} from './affiliate-feeds.component';
import { AffiliateFeed, AffiliateProgram } from '../../models/affiliate-catalog.models';

describe('Affiliate feeds grid configuration', () => {
  it('keeps the read-only grid free from action columns', () => {
    const columns = buildAffiliateFeedColumns(false)[0].data;

    expect(columns.some((column) => column.type === 'campoButton')).toBeFalse();
  });

  it('adds sync, mapping and edit actions for administrators', () => {
    const columns = buildAffiliateFeedColumns(true)[0].data;
    const actions = columns
      .filter((column) => column.type === 'campoButton')
      .map((column) => column.button?.name);

    expect(actions).toEqual(['sync', 'mapping', 'edit']);
  });

  it('does not expose a delete action', () => {
    const columns = buildAffiliateFeedColumns(true)[0].data;
    const actionNames = columns
      .filter((column) => column.type === 'campoButton')
      .map((column) => column.button?.name);

    expect(actionNames).not.toContain('delete');
  });
});

describe('Affiliate feed sync eligibility', () => {
  const program: AffiliateProgram = {
    id: 'program-1',
    network: 'TRADEDOUBLER',
    networkProgramId: 'external-program-1',
    name: 'Programma 1',
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

  it('accepts an enabled feed attached to an enabled active program', () => {
    expect(affiliateFeedSyncEligibility(feed, program)).toBeNull();
  });

  it('rejects a disabled feed before the request is sent', () => {
    expect(affiliateFeedSyncEligibility({ ...feed, enabled: false }, program)).toContain('feed');
  });

  it('rejects a disabled or inactive program before the request is sent', () => {
    expect(affiliateFeedSyncEligibility(feed, { ...program, enabled: false })).toContain('disabilitato');
    expect(affiliateFeedSyncEligibility(feed, { ...program, networkStatus: 'INACTIVE' })).toContain('network');
  });

  it('rejects a feed whose associated program is unavailable', () => {
    expect(affiliateFeedSyncEligibility(feed, undefined)).toContain('non è disponibile');
  });
});

describe('Affiliate feed sync error mapping', () => {
  it('maps conflict to an eligibility or active-run message', () => {
    expect(affiliateFeedSyncErrorMessage(409)).toContain('sincronizzazione attiva');
  });

  it('maps authorization and connectivity errors', () => {
    expect(affiliateFeedSyncErrorMessage(403)).toContain('autorizzato');
    expect(affiliateFeedSyncErrorMessage(0)).toContain('Backend');
  });

  it('keeps unexpected failures generic', () => {
    expect(affiliateFeedSyncErrorMessage(500)).toContain('non riuscito');
  });
});
