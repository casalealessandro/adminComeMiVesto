import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
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
      ['getProducts', 'getProductSubcategories', 'getOutfitColors', 'getProductCategories', 'getCurationCategories']);
    service.getProductSubcategories.and.returnValue(of(['jeans', 'jogger']));
    service.getCurationCategories.and.returnValue(of([{ id: 'jeans', categoryName: 'Jeans' }]));
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
    const columns = buildReplacementPickerColumns(['jeans', 'jogger'],
      [{ id: 'BN', value: 'Blu navy' }])[0].data;
    expect(columns.map(x => x.colCaption)).toEqual(
      ['Immagine', 'Nome', 'Stile', 'Sottocategoria', 'Colore'],
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
    const color = columns.find(x => x.dataField === 'normalizedColor');
    expect(style?.lista?.options).toContain(jasmine.objectContaining({ value: 'SMART_CASUAL', label: 'Smart Casual' }));
    expect(color?.lista?.options).toEqual([{ value: 'BN', label: 'Blu navy' }]);
    expect(picker.columns[0].data.map(x => x.dataField)).toEqual(columns.map(x => x.dataField));
  });

  it('translates native grid filters and a name search into remote paginated catalog criteria', async () => {
    const page = await picker.loadPage({
      pageSize: 30, continuation: 'cursor-1',
      filters: [
        { field: 'name', operator: 'contains', value: 'pantaloni' },
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

  it('keeps category and gender fixed in the request, not as grid filters', async () => {
    service.getProducts.calls.reset();
    await expectAsync(picker.loadPage({
      pageSize: 30,
      filters: [{ field: 'genderLabel', operator: 'eq', value: 'U' }],
    })).toBeRejectedWithError(/Filtro della griglia/);
    await expectAsync(picker.loadPage({
      pageSize: 30,
      filters: [{ field: 'category', operator: 'eq', value: 'P_Pantaloni' }],
    })).toBeRejectedWithError(/Filtro della griglia/);
    expect(service.getProducts).not.toHaveBeenCalled();
    await picker.loadPage({ pageSize: 30, search: { value: 'jeans', conditions: [] } });
    expect(service.getProducts).toHaveBeenCalledWith(jasmine.objectContaining({
      q: 'jeans', category: 'P_Pantaloni', gender: 'D',
    }));
    await expectAsync(picker.loadPage({
      pageSize: 30, filters: [{ field: 'wrong', operator: 'eq', value: 'x' }],
    })).toBeRejectedWithError(/Filtro della griglia/);
  });

  it('switches skirt to jeans without requesting product categories again', async () => {
    picker.itemData = {
      category: 'conna', gender: 'D', role: 'BOTTOM',
      allowedCategories: ['conna', 'P_Pantaloni'],
      productIdsInOutfit: ['already-used'],
    };
    picker.ngOnInit();
    expect(picker.selectedCategory).toBe('conna');
    expect(picker.categoryOptions).toEqual(['conna', 'P_Pantaloni']);
    expect(service.getProductCategories).not.toHaveBeenCalled();

    picker.changeCategory('scarpe'); // incompatible category must not be selectable
    expect(picker.selectedCategory).toBe('conna');
    picker.changeCategory('P_Pantaloni');
    expect(picker.selectedCategory).toBe('P_Pantaloni');
    expect(service.getProductSubcategories).toHaveBeenCalledWith('P_Pantaloni');
    const page = await picker.loadPage({ pageSize: 30 });
    expect(service.getProducts).toHaveBeenCalledWith(jasmine.objectContaining({
      category: 'P_Pantaloni', gender: 'D', activeOnly: true, visibleInApp: true,
    }));
    expect(page.items.map(item => item.id)).toEqual(['new-product']);
    const emitted: unknown[] = [];
    picker.result.subscribe(value => emitted.push(value));
    picker.selectRow({ name: 'onRowSelectionChange', data: eligible });
    expect(emitted).toEqual([{ name: 'selected', product: eligible }]);
  });

  it('keeps the product grid usable when optional filter APIs return 503', async () => {
    service.getProductSubcategories.and.returnValue(throwError(() => ({ status: 503 })));
    service.getOutfitColors.and.returnValue(throwError(() => ({ status: 503 })));
    picker.ngOnInit();
    expect(picker.loading).toBeFalse();
    expect(picker.provider).toBeDefined();
    expect(picker.columns[0].data.map(column => column.dataField)).toContain('name');
    expect(picker.filterWarning).toContain('Filtro colori');
    expect(service.getCurationCategories).toHaveBeenCalledWith('P_Pantaloni');
    expect(picker.columns[0].data.find(column => column.dataField === 'subcategory')?.lista?.options)
      .toEqual([{ value: 'jeans', label: 'jeans' }]);
    expect(service.getProductCategories).not.toHaveBeenCalled();
    const page = await picker.loadPage({ pageSize: 30 });
    expect(page.items.map(item => item.id)).toEqual(['new-product']);
  });

  it('reloads subcategories for each category and removes the previous choices', () => {
    service.getProductSubcategories.and.callFake((category?: string) => of(
      category === 'conna' ? ['gonne_midi', 'gonne_corte'] : ['jeans', 'short_donna'],
    ));
    picker.itemData = {
      category: 'conna', gender: 'D', role: 'BOTTOM',
      allowedCategories: ['conna', 'P_Pantaloni'], productIdsInOutfit: [],
    };
    picker.ngOnInit();
    expect(picker.columns[0].data.find(c => c.dataField === 'subcategory')?.lista?.options)
      .toEqual([{ value: 'gonne_corte', label: 'gonne_corte' },
        { value: 'gonne_midi', label: 'gonne_midi' }]);
    picker.changeCategory('P_Pantaloni');
    expect(service.getProductSubcategories).toHaveBeenCalledWith('P_Pantaloni');
    expect(picker.columns[0].data.find(c => c.dataField === 'subcategory')?.lista?.options)
      .toEqual([{ value: 'jeans', label: 'jeans' },
        { value: 'short_donna', label: 'short_donna' }]);
    expect(picker.categoryDisplayName('P_Pantaloni')).toBe('Pantaloni e jeans');
    expect(picker.categoryDisplayName('conna')).toBe('Gonne');
  });

  it('ignores an old metadata response when category changes while loading', () => {
    const delayed = new Subject<string[]>();
    service.getProductSubcategories.and.callFake((category?: string) =>
      category === 'conna' ? delayed.asObservable() : of(['jeans']));
    picker.itemData = {
      category: 'conna', gender: 'D', role: 'BOTTOM',
      allowedCategories: ['conna', 'P_Pantaloni'], productIdsInOutfit: [],
    };
    picker.ngOnInit();
    expect(picker.loading).toBeTrue();
    picker.changeCategory('P_Pantaloni');
    expect(picker.loading).toBeFalse();
    delayed.next(['gonne_midi']);
    delayed.complete();
    expect(picker.columns[0].data.find(c => c.dataField === 'subcategory')?.lista?.options)
      .toEqual([{ value: 'jeans', label: 'jeans' }]);
  });

  it('excludes a dress from TOP even when it shares the body category', async () => {
    picker.itemData = {
      category: 'ABC_Completi', gender: 'D', role: 'TOP',
      allowedCategories: ['ABC_Completi', 'camicie'], productIdsInOutfit: [],
    };
    picker.ngOnInit();
    const body = { ...eligible, id: 'body-1', category: 'ABC_Completi', subcategory: 'body' };
    const dress = { ...eligible, id: 'dress-1', category: 'ABC_Completi', subcategory: 'vestito_midi' };
    service.getProducts.and.returnValue(of({
      data: [body, dress], pagination: { hasMore: false, nextCursor: null },
    }));
    const page = await picker.loadPage({ pageSize: 30 });
    expect(page.items.map(item => item.id)).toEqual(['body-1']);
    const emitted: unknown[] = [];
    picker.result.subscribe(value => emitted.push(value));
    picker.selectRow({ name: 'onRowSelectionChange', data: dress });
    expect(emitted).toEqual([]);
    picker.selectRow({ name: 'onRowSelectionChange', data: body });
    expect(emitted).toEqual([{ name: 'selected', product: body }]);
  });

  it('loads another page explicitly even if excluded products make current page short', async () => {
    const fetchMore = jasmine.createSpy('loadNextRemotePage').and.resolveTo(true);
    picker.grid = {
      remoteHasMore: true, isLoading: false, loadNextRemotePage: fetchMore,
    } as any;
    await picker.loadMore();
    expect(fetchMore).toHaveBeenCalledTimes(1);
    (picker.grid as any).isLoading = true;
    await picker.loadMore();
    expect(fetchMore).toHaveBeenCalledTimes(1);
    (picker.grid as any).isLoading = false;
    (picker.grid as any).remoteHasMore = false;
    await picker.loadMore();
    expect(fetchMore).toHaveBeenCalledTimes(1);
  });

  it('surfaces a failed explicit continuation request', async () => {
    const fetchMore = jasmine.createSpy('loadNextRemotePage').and.resolveTo(false);
    picker.grid = {
      remoteHasMore: true, isLoading: false, loadNextRemotePage: fetchMore,
    } as any;
    await picker.loadMore();
    expect(picker.error).toContain('Impossibile caricare');
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
