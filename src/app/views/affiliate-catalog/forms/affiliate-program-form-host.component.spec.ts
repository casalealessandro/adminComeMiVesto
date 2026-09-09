import {
  affiliateProgramErrorMessage,
  buildAffiliateProgramCreateInput,
  buildAffiliateProgramUpdateInput,
} from './affiliate-program-form-host.component';

describe('Affiliate program form mapping', () => {
  const formData: Record<string, unknown> = {
    network: 'TRADEDOUBLER',
    networkProgramId: ' 12345 ',
    name: ' Programma demo ',
    networkStatus: 'ACTIVE',
    enabled: true,
    defaultAdapterType: ' TRADEDOUBLER ',
    market: ' it ',
    currency: ' eur ',
    priceSegment: 'MID_RANGE',
  };

  it('normalizes the create DTO without adding server-managed fields', () => {
    expect(buildAffiliateProgramCreateInput(formData)).toEqual({
      network: 'TRADEDOUBLER',
      networkProgramId: '12345',
      name: 'Programma demo',
      networkStatus: 'ACTIVE',
      enabled: true,
      defaultAdapterType: 'TRADEDOUBLER',
      market: 'IT',
      currency: 'EUR',
      priceSegment: 'MID_RANGE',
    });
  });

  it('omits immutable network identity fields from the update DTO', () => {
    const update = buildAffiliateProgramUpdateInput(formData) as Record<string, unknown>;

    expect(update['network']).toBeUndefined();
    expect(update['networkProgramId']).toBeUndefined();
    expect(update['name']).toBe('Programma demo');
    expect(update['market']).toBe('IT');
    expect(update['currency']).toBe('EUR');
  });

  it('maps relevant backend statuses to readable messages', () => {
    expect(affiliateProgramErrorMessage(400)).toContain('dati');
    expect(affiliateProgramErrorMessage(403)).toContain('autorizzato');
    expect(affiliateProgramErrorMessage(409)).toContain('già');
    expect(affiliateProgramErrorMessage(500)).toContain('non riuscita');
  });
});
