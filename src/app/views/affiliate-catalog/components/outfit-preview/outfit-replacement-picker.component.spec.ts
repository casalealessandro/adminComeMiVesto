import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AffiliateCatalogService } from '../../services/affiliate-catalog.service';
import {
  OutfitReplacementPickerComponent,
  OutfitReplacementRow,
  replacementPickerColumns,
} from './outfit-replacement-picker.component';

describe('OutfitReplacementPickerComponent', () => {
  const eligible = {
    id: 'new-product', name: 'Jeans neri', brand: 'Brand',
    category: 'P_Pantaloni', subcategory: 'jeans', normalizedColor: 'BN',
    genderTargets: ['D'], active: true, enabledForApp: true,
    genderLabel: 'Donna', styleLabel: 'Casual, Trendy', colorLabel: 'Blu navy',
    fashionProfile: { styleAffinities: ['CASUAL', 'TRENDY'] },
  } as unknown as OutfitReplacementRow;

  let service: jasmine.SpyObj<AffiliateCatalogService>;
  let picker: OutfitReplacementPickerComponent;

  beforeEach(() => {
    service = jasmine.createSpyObj('AffiliateCatalogService',
      ['getProducts', 'getProductSubcategories', 'getOutfitColors']);
    service.getProductSubcategories.and.returnValue(of(['jeans', 'jogger']));
    service.getOutfitColors.and.returnValue(of([{ id: 'BN', value: 'Blu navy' }]));
    service.getProducts.and.returnValue(of({
      data: [eligible, { ...eligible, id: 'already-used' }],
      pagination: { hasMore: true, nextCursor: 'cursor-2' },
    }));
    TestBed.configureTestingModule({
      providers: [{ provide: AffiliateCatalogService, useValue: service }],
    });
    picker = TestBed.runInInjectionContext(() => new OutfitReplacementPickerComponent());
    picker.itemData = {
      category: 'P_Pantaloni', gender: 'D', productIdsInOutfit: ['already-used'],
    };
    picker.ngOnInit();
  });

  it('shows only the six requested columns', () => {
    expect(replacementPickerColumns[0].data.map(x => x.colCaption))
      .toEqual(['Nome', 'Genere', 'Stile', 'Categoria', 'Sottocategoria', 'Colore']);
  });

  it('sends global search and exact filters server side with cursor and excludes already used ids', async () => {
    picker.subcategory = 'jeans';
    picker.style = 'CASUAL';
    picker.color = 'BN';
    const page = await picker.loadPage({
      pageSize: 30, continuation: 'cursor-1',
      search: { value: 'pantaloni', conditions: [] },
    });
    expect(service.getProducts).toHaveBeenCalledWith({
      limit: 30, cursor: 'cursor-1', q: 'pantaloni',
      category: 'P_Pantaloni', gender: 'D',
      activeOnly: true, visibleInApp: true,
      subcategory: 'jeans', style: 'CASUAL', color: 'BN',
    });
    expect(page.items.map(item => item.id)).toEqual(['new-product']);
    expect(page.items[0].styleLabel).toContain('Trendy');
    expect(page.items[0].colorLabel).toBe('Blu navy');
    expect(page.continuation).toBe('cursor-2');
    expect(page.hasMore).toBeTrue();
  });

  it('chooses an eligible single row and refuses mismatched or already-used products', () => {
    const emitted: unknown[] = [];
    picker.result.subscribe(value => emitted.push(value));
    picker.selectRow({ name: 'onRowOnlyClick', data: eligible });
    expect(emitted.length).toBe(0);
    picker.selectRow({ name: 'onRowSelectionChange', data: { ...eligible, genderTargets: ['U'] } });
    picker.selectRow({ name: 'onRowSelectionChange', data: { ...eligible, id: 'already-used' } });
    expect(emitted.length).toBe(0);
    picker.selectRow({ name: 'onRowSelectionChange', data: eligible });
    expect(emitted).toEqual([{ name: 'selected', product: eligible }]);
  });
});
