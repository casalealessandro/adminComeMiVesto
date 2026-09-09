import { buildAffiliateFeedColumns } from './affiliate-feeds.component';

describe('Affiliate feeds grid configuration', () => {
  it('keeps the read-only grid free from action columns', () => {
    const columns = buildAffiliateFeedColumns(false)[0].data;

    expect(columns.some((column) => column.type === 'campoButton')).toBeFalse();
  });

  it('adds exactly one edit action for administrators', () => {
    const columns = buildAffiliateFeedColumns(true)[0].data;
    const actions = columns.filter((column) => column.type === 'campoButton');

    expect(actions.length).toBe(1);
    expect(actions[0].button?.name).toBe('edit');
  });

  it('does not expose sync or delete actions in phase D.1', () => {
    const columns = buildAffiliateFeedColumns(true)[0].data;
    const actionNames = columns
      .filter((column) => column.type === 'campoButton')
      .map((column) => column.button?.name);

    expect(actionNames).not.toContain('sync');
    expect(actionNames).not.toContain('delete');
  });
});
