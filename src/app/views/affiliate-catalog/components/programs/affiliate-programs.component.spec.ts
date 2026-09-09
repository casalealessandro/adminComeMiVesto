import {
  buildAffiliateProgramColumns,
  buildAffiliateProgramGridRows,
} from './affiliate-programs.component';
import { AffiliateProgram } from '../../models/affiliate-catalog.models';

describe('AffiliateProgramsComponent configuration', () => {
  const enabledProgram: AffiliateProgram = {
    id: 'program-enabled',
    network: 'TRADEDOUBLER',
    networkProgramId: 'network-enabled',
    name: 'Program enabled',
    networkStatus: 'ACTIVE',
    enabled: true,
    defaultAdapterType: 'TRADEDOUBLER',
    market: 'IT',
    currency: 'EUR',
    priceSegment: 'MID_RANGE',
    createdAt: 1,
    updatedAt: 2,
  };

  it('does not expose edit actions to read-only backoffice users', () => {
    const columns = buildAffiliateProgramColumns(false)[0].data;

    expect(columns.some((column) => column.type === 'campoButton')).toBeFalse();
    expect(columns.some((column) => column.dataField === 'name')).toBeTrue();
    expect(columns.some((column) => column.dataField === 'enabledLabel')).toBeTrue();
  });

  it('adds exactly one edit action for administrators', () => {
    const columns = buildAffiliateProgramColumns(true)[0].data;
    const actions = columns.filter((column) => column.type === 'campoButton');

    expect(actions.length).toBe(1);
    expect(actions[0].button?.name).toBe('edit');
  });

  it('maps the enabled state to the display-only grid label', () => {
    const rows = buildAffiliateProgramGridRows([
      enabledProgram,
      { ...enabledProgram, id: 'program-disabled', enabled: false },
    ]);

    expect(rows.map((row) => row.enabledLabel)).toEqual(['Sì', 'No']);
  });
});
