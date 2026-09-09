import { buildAffiliateProgramColumns } from './affiliate-programs.component';

describe('AffiliateProgramsComponent configuration', () => {
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
});
