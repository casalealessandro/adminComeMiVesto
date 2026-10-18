import { GridDataProvider, GridFilter, GridLoadRequest, GridPage } from '../../core/data-grid/data-grid-provider';
import { outfit, OutfitsService } from '../../services/outfit.service';

export type OutfitGridFilters = Record<string, string>;

const SUPPORTED_COLUMNS = new Set([
  'id', 'title', 'description', 'imageUrl', 'userId', 'gender', 'style', 'season', 'occasion',
  'status', 'outfitCategory', 'outfitSubCategory', 'color', 'brend',
  'createdAt', 'updatedAt', 'likes', 'visits', 'source', 'createdBy',
]);

export const OUTFIT_GENDER_LABELS: Record<string, string> = { U: 'Uomo', D: 'Donna' };
export const OUTFIT_SEASON_LABELS: Record<string, string> = { P: 'Primavera', E: 'Estate', A: 'Autunno', I: 'Inverno' };
export const OUTFIT_OCCASION_LABELS: Record<string, string> = {
  EVERYDAY: 'Quotidiano', OFFICE: 'Ufficio', APERITIVO: 'Aperitivo',
  CEREMONY: 'Cerimonia', EVENING: 'Sera', SPORT: 'Sport', TRAVEL: 'Viaggio',
};

export function formatOutfitGridItem(item: outfit, creatorName: (uid: string) => string): outfit {
  return {
    ...item,
    userName: creatorName(String(item.userId ?? '')),
    genderLabel: OUTFIT_GENDER_LABELS[item.gender] ?? item.gender ?? '—',
    seasonLabel: OUTFIT_SEASON_LABELS[item.season] ?? item.season ?? '—',
    occasionLabel: item.occasion ? (OUTFIT_OCCASION_LABELS[item.occasion] ?? item.occasion) : '—',
  };
}

export function toOutfitRemoteFilters(request: GridLoadRequest): GridFilter[] {
  return (request.filters || []).filter(filter =>
    SUPPORTED_COLUMNS.has(filter.field) &&
    ['eq', 'contains', 'sameDay'].includes(filter.operator) &&
    (typeof filter.value === 'string' || typeof filter.value === 'number'));
}

/** Provider uses the existing REST endpoint; the Grid stays transport-neutral. */
export function createOutfitsGridProvider(
  service: OutfitsService,
  getFilters: () => OutfitGridFilters,
  creatorName: (userId: string) => string,
  onPage: (items: outfit[], append: boolean, total: number) => void,
  onError: () => void,
): GridDataProvider<outfit> {
  return {
    async load(request: GridLoadRequest): Promise<GridPage<outfit>> {
      const page = typeof request.continuation === 'number' && request.continuation >= 2
        ? request.continuation : 1;
      const sort = request.sort?.[0] ?? { field: 'createdAt', direction: 'desc' as const };
      const sortField = SUPPORTED_COLUMNS.has(sort.field) ? sort.field : 'createdAt';
      const base = getFilters();
      const explicit = toOutfitRemoteFilters(request);
      const filters: Record<string, string> = {
        ...base,
        search: request.search?.value?.trim() || base['search'] || '',
        sortField,
        sortDirection: sort.direction,
        gridFilters: JSON.stringify([
          ...explicit,
          ...(base['color'] ? [{ field: 'color', operator: 'eq', value: base['color'] }] : []),
        ]),
      };
      try {
        const rows = await service.getAdminOutfits(filters, page, request.pageSize);
        const total = service.pagination().total;
        const items = rows.map(item => formatOutfitGridItem(item, creatorName));
        const hasMore = page * request.pageSize < total;
        onPage(items, page > 1, total);
        return {
          items,
          totalCount: total,
          hasMore,
          continuation: hasMore ? page + 1 : undefined,
        };
      } catch (error) {
        onError();
        throw error;
      }
    },
    async delete(item: outfit): Promise<void> {
      await service.deleteAdminOutfit(String(item.id));
    },
  };
}
