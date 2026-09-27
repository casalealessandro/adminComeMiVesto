import {
  affiliateFeedErrorMessage,
  buildAffiliateFeedCreateInput,
  buildAffiliateFeedUpdateInput,
  buildRulesMapperJson,
  SKIP_CATEGORY_MAPPING,
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
    rules: ' {"version":1} ',
    rulesMapper: ' {"version":1} ',
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
      rules: '{"version":1}',
      rulesMapper: '{"version":1}',
    });
  });

  it('omits immutable feed identity fields from update and includes rules configuration', () => {
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
    expect(update['rules']).toBe('{"version":1}');
    expect(update['rulesMapper']).toBe('{"version":1}');
  });

  it('builds rulesMapper from visual category, color and gender associations', () => {
    const json = buildRulesMapperJson(
      {
        recordsRead: 10,
        recordsNormalized: 10,
        categories: ['Jeans', 'Gift Card'],
        colors: ['Black'],
        genders: ['female', 'unisex'],
      },
      [
        { id: 'jeans-sub', parentCategory: 'clothing', label: 'Abbigliamento / Jeans' },
      ],
      { Jeans: 'jeans-sub', 'Gift Card': SKIP_CATEGORY_MAPPING },
      { Black: 'N' },
      { female: 'D', unisex: 'U,D' },
    );

    expect(JSON.parse(json)).toEqual({
      version: 1,
      category: {
        source: 'category',
        values: {
          Jeans: { category: 'clothing', subcategory: 'jeans-sub' },
          'Gift Card': { skip: true },
        },
      },
      color: { source: 'merchantColor', values: { Black: 'N' } },
      gender: { source: 'gender', values: { female: ['D'], unisex: ['U', 'D'] } },
    });
  });

  it('leaves unmapped source values out of generated rulesMapper', () => {
    const json = buildRulesMapperJson(
      {
        recordsRead: 1,
        recordsNormalized: 1,
        categories: ['Unknown'],
        colors: ['Unknown'],
        genders: ['unknown'],
      },
      [],
      {},
      {},
      {},
    );

    const mapper = JSON.parse(json);
    expect(mapper.category.values).toEqual({});
    expect(mapper.color.values).toEqual({});
    expect(mapper.gender.values).toEqual({});
  });

  it('maps relevant backend statuses to readable messages', () => {
    expect(affiliateFeedErrorMessage(400)).toContain('JSON');
    expect(affiliateFeedErrorMessage(403)).toContain('autorizzato');
    expect(affiliateFeedErrorMessage(404)).toContain('disponibile');
    expect(affiliateFeedErrorMessage(409)).toContain('già');
    expect(affiliateFeedErrorMessage(500)).toContain('non riuscita');
  });
});
