import {
  affiliateFeedErrorMessage,
  buildAffiliateFeedCreateInput,
  buildAffiliateFeedUpdateInput,
} from './affiliate-feed-form-host.component';

describe('Affiliate feed form mapping', () => {
  const formData: Record<string, unknown> = {
    networkFeedId: ' feed-123 ',
    affiliateProgramId: ' program-1 ',
    name: ' Feed demo ',
    enabled: true,
    adapterType: '   ',
    readMode: 'PAGINATED',
    locale: ' it-IT ',
    market: ' it ',
  };

  it('normalizes create data and maps an empty adapter to null', () => {
    expect(buildAffiliateFeedCreateInput(formData)).toEqual({
      networkFeedId: 'feed-123',
      affiliateProgramId: 'program-1',
      name: 'Feed demo',
      enabled: true,
      adapterType: null,
      readMode: 'PAGINATED',
      locale: 'it-IT',
      market: 'IT',
    });
  });

  it('omits immutable feed identity fields from update', () => {
    const update = buildAffiliateFeedUpdateInput({
      ...formData,
      adapterType: ' TRADEDOUBLER ',
    }) as Record<string, unknown>;

    expect(update['networkFeedId']).toBeUndefined();
    expect(update['affiliateProgramId']).toBeUndefined();
    expect(update['name']).toBe('Feed demo');
    expect(update['adapterType']).toBe('TRADEDOUBLER');
    expect(update['locale']).toBe('it-IT');
    expect(update['market']).toBe('IT');
  });

  it('maps relevant backend statuses to readable messages', () => {
    expect(affiliateFeedErrorMessage(400)).toContain('dati');
    expect(affiliateFeedErrorMessage(403)).toContain('autorizzato');
    expect(affiliateFeedErrorMessage(404)).toContain('disponibile');
    expect(affiliateFeedErrorMessage(409)).toContain('già');
    expect(affiliateFeedErrorMessage(500)).toContain('non riuscita');
  });
});
