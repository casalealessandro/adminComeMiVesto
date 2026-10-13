import {
  affiliateFeedSyncEligibility,
  affiliateFeedSyncErrorMessage,
  affiliateCleanupCanStop,
  affiliateCleanupIsActive,
  affiliateCleanupHasOldProgress,
  buildAffiliateFeedColumns,
} from './affiliate-feeds.component';
import { AffiliateFeed, AffiliateFeedCleanupJob, AffiliateProgram } from '../../models/affiliate-catalog.models';

describe('Affiliate feeds grid configuration', () => {
  it('keeps the read-only grid free from action columns', () => {
    const columns = buildAffiliateFeedColumns(false)[0].data;

    expect(columns.some((column) => column.type === 'campoButton')).toBeFalse();
  });

  it('adds sync, mapping and both verified deletion actions for administrators', () => {
    const columns = buildAffiliateFeedColumns(true)[0].data;
    const actions = columns
      .filter((column) => column.type === 'campoButton')
      .map((column) => column.button?.name);

    expect(actions).toEqual(['sync', 'mapping', 'deactivate-products', 'delete-products', 'delete-feed', 'edit']);
  });

  it('exposes an explicit non-destructive feed product deactivation action', () => {
    const columns = buildAffiliateFeedColumns(true)[0].data;
    const action = columns
      .filter((column) => column.type === 'campoButton')
      .find((column) => column.button?.name === 'deactivate-products');

    expect(action?.button?.hint).toContain('Disattiva prodotti');
  });

  it('exposes both explicit, distinct feed cleanup actions', () => {
    const columns = buildAffiliateFeedColumns(true)[0].data;
    const actionNames = columns
      .filter((column) => column.type === 'campoButton')
      .map((column) => column.button?.name);

    expect(actionNames).toContain('delete-products');
    expect(actionNames).toContain('delete-feed');
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

describe('Affiliate feed cleanup stop states', () => {
  const job: AffiliateFeedCleanupJob = {
    feedId: 'feed-1', runId: 'test-run', mode: 'PRODUCTS_ONLY',
    status: 'RUNNING', stage: 'PRODUCTS', cursor: null,
    createdAt: 1, updatedAt: 2, completedAt: null,
    previewAt: null, preview: null,
    progress: {
      productsDeleted: 2, productsDetached: 0, productsPreservedForOutfits: 0,
      productsPreservedForOtherFeeds: 0, variantsDeleted: 0, offersDeleted: 0,
    },
    lastError: null,
  };

  it('allows stopping active cleanup but never a completed or already stopping operation', () => {
    for (const status of ['QUEUED', 'PREVIEWING', 'RUNNING'] as const) {
      expect(affiliateCleanupCanStop({ ...job, status })).toBeTrue();
      expect(affiliateCleanupIsActive({ ...job, status })).toBeTrue();
    }
    expect(affiliateCleanupCanStop({ ...job, status: 'STOP_REQUESTED' })).toBeFalse();
    expect(affiliateCleanupIsActive({ ...job, status: 'STOP_REQUESTED' })).toBeTrue();
    for (const status of ['STOPPED', 'SUCCESS', 'FAILED', 'PREVIEW_READY'] as const) {
      expect(affiliateCleanupCanStop({ ...job, status })).toBeFalse();
      expect(affiliateCleanupIsActive({ ...job, status })).toBeFalse();
    }
  });
  it('warns when RUNNING has not updated for 35 minutes without declaring it finished', () => {
    expect(affiliateCleanupHasOldProgress({ ...job, status: 'RUNNING', updatedAt: 1000 }, 1000 + 34 * 60 * 1000)).toBeFalse();
    expect(affiliateCleanupHasOldProgress({ ...job, status: 'RUNNING', updatedAt: 1000 }, 1000 + 36 * 60 * 1000)).toBeTrue();
    expect(affiliateCleanupHasOldProgress({ ...job, status: 'STOPPED', updatedAt: 1000 }, 1000 + 36 * 60 * 1000)).toBeFalse();
  });

});
