import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AffiliateCatalogService } from '../../services/affiliate-catalog.service';
import {
  OutfitReplacementPickerComponent,
  OutfitReplacementRow,
  buildReplacementPickerColumns,
} from './outfit-replacement-picker.component';

describe('OutfitReplacementPickerComponent', () => {
  const eligible = {
    id: 'new-product', name: 'Jeans neri', brand: 'Brand',
    category: 'P_Pantaloni', subcategory: 'jeans', normalizedColor: 'BN',
    genderTargets: ['D'], active: true, enabledForApp: true,
    genderLabel: 'Donna', styleLabel: 'Casual, Trendy',
    images: ['http://merchant.test/insecure.jpg', 'https://merchant.test/item.jpg'],
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

  it('uses the Core grid image column and its native list/text filter metadata', () => {
    const columns = buildReplacementPickerColumns('P_Pantaloni', 'D', ['jeans', 'jogger'],
      [{ id: 'BN', value: 'Blu navy' }])[0].data;
    expect(columns.map(x => x.colCaption)).toEqual(
      ['Immagine', 'Nome', 'Genere', 'Stile', 'Categoria', 'Sottocategoria', 'Colore'],
    );
    expect(columns[0].type).toBe('campoImg');
    expect(columns[0].allowFiltering).toBeFalse();
    expect(columns[1].type).toBe('campo');
    expect(columns[1].allowFiltering).toBeTrue();
    for (const col of columns.slice(2)) {
      expect(col.type).toBe('campoLista');
      expect(col.allowFiltering).toBeTrue();
    }
    const style = columns.find(x => x.dataField === 'styleLabel');
    const gender = columns.find(x => x.dataField === 'genderLabel');
    const color = columns.find(x => x.dataField === 'normalizedColor');
    expect(style?.lista?.options).toContain(jasmine.objectContaining({ value: 'SMART_CASUAL', label: 'Smart Casual' }));
    expect(gender?.lista?.options).toEqual([{ value: 'D', label: 'Donna' }]);
    expect(color?.lista?.options).toEqual([{ value: 'BN', label: 'Blu navy' }]);
    expect(picker.columns[0].data.map(x => x.dataField)).toEqual(columns.map(x => x.dataField));
  });

  it('translates native grid filters and a name search into remote paginated catalog criteria', async () => {
    const page = await picker.loadPage({
      pageSize: 30, continuation: 'cursor-1',
      filters: [
        { field: 'name', operator: 'contains', value: 'pantaloni' },
        { field: 'genderLabel', operator: 'eq', value: 'D' },
        { field: 'category', operator: 'eq', value: 'P_Pantaloni' },
        { field: 'subcategory', operator: 'eq', value: 'jeans' },
        { field: 'styleLabel', operator: 'eq', value: 'CASUAL' },
        { field: 'normalizedColor', operator: 'eq', value: 'BN' },
      ],
    });
    expect(service.getProducts).toHaveBeenCalledWith({
      limit: 30, cursor: 'cursor-1', q: 'pantaloni',
      category: 'P_Pantaloni', gender: 'D',
      activeOnly: true, visibleInApp: true,
      subcategory: 'jeans', style: 'CASUAL', color: 'BN',
    });
    expect(page.items.map(item => item.id)).toEqual(['new-product']);
    expect(page.items[0].imagePreview).toBe('https://merchant.test/item.jpg');
    expect(page.items[0].styleLabel).toContain('Trendy');
    expect(page.continuation).toBe('cursor-2');
    expect(page.hasMore).toBeTrue();
  });

  it('keeps category and gender fixed and supports Core global search for compatibility', async () => {
    service.getProducts.calls.reset();
    const invalid = await picker.loadPage({
      pageSize: 30,
      filters: [{ field: 'genderLabel', operator: 'eq', value: 'U' }],
    });
    expect(invalid).toEqual({ items: [], hasMore: false });
    expect(service.getProducts).not.toHaveBeenCalled();
    await picker.loadPage({ pageSize: 30, search: { value: 'jeans', conditions: [] } });
    expect(service.getProducts).toHaveBeenCalledWith(jasmine.objectContaining({ q: 'jeans' }));
    await expectAsync(picker.loadPage({
      pageSize: 30, filters: [{ field: 'wrong', operator: 'eq', value: 'x' }],
    })).toBeRejectedWithError(/Filtro della griglia/);
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
