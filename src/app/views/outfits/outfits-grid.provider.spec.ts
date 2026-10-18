import { GridLoadRequest } from '../../core/data-grid/data-grid-provider';
import { createOutfitsGridProvider, formatOutfitGridItem, toOutfitRemoteFilters } from './outfits-grid.provider';
import { OutfitsService } from '../../services/outfit.service';

describe('Outfits remote grid provider', () => {
  it('renders full gender, season and occasion labels while preserving canonical API values', () => {
    const source = {
      id: 'look-1', userId: 'u-1', title: 'Outfit da lavoro',
      gender: 'D', season: 'A', occasion: 'OFFICE',
    } as any;
    const row = formatOutfitGridItem(source, () => 'Maria Rossi');
    expect(row.userName).toBe('Maria Rossi');
    expect(row.genderLabel).toBe('Donna');
    expect(row.seasonLabel).toBe('Autunno');
    expect(row.occasionLabel).toBe('Ufficio');
    expect(row.gender).toBe('D');
    expect(row.season).toBe('A');
    expect(row.occasion).toBe('OFFICE');
    expect(formatOutfitGridItem({ ...source, occasion: undefined }, () => 'Alias').occasionLabel).toBe('—');
  });

  it('forwards only supported column filters', () => {
    const request: GridLoadRequest = {
      pageSize: 10,
      filters: [
        { field: 'title', operator: 'contains', value: 'blazer' },
        { field: 'createdAt', operator: 'sameDay', value: '2026-10-18' },
        { field: 'secret', operator: 'eq', value: 'no' },
      ],
    };
    expect(toOutfitRemoteFilters(request)).toEqual(request.filters!.slice(0, 2));
  });

  it('translates paging, filters and sorting to the existing API', async () => {
    const sample = { id: 'look-1', title: 'Look', userId: 'user-1', status: 'approved' } as any;
    const service = {
      pagination: () => ({ page: 2, limit: 10, total: 25 }),
      getAdminOutfits: jasmine.createSpy().and.resolveTo([sample]),
    } as unknown as OutfitsService;
    const onPage = jasmine.createSpy('onPage');
    const provider = createOutfitsGridProvider(
      service, () => ({ status: 'approved', color: 'N' }),
      id => 'Creator ' + id, onPage, () => fail('Unexpected provider error'),
    );
    const result = await provider.load({
      pageSize: 10, continuation: 2,
      search: { value: 'look', conditions: [{ field: 'title', operator: 'contains', value: 'look' }] },
      filters: [{ field: 'season', operator: 'eq', value: 'I' }],
      sort: [{ field: 'createdAt', direction: 'asc' }],
    });
    const args = (service.getAdminOutfits as jasmine.Spy).calls.mostRecent().args;
    expect(args[1]).toBe(2);
    expect(args[2]).toBe(10);
    expect(args[0].search).toBe('look');
    expect(args[0].sortDirection).toBe('asc');
    expect(JSON.parse(args[0].gridFilters)).toEqual([
      { field: 'season', operator: 'eq', value: 'I' },
      { field: 'color', operator: 'eq', value: 'N' },
    ]);
    expect(result.items[0].userName).toBe('Creator user-1');
    expect(result.continuation).toBe(3);
    expect(result.totalCount).toBe(25);
    expect(onPage).toHaveBeenCalled();
  });
});
