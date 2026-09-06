import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AnagraficaService } from '../../../services/anagrafica.service';
import { GridLookupDataProvider } from '../data-grid-lookup-provider';
import { GridLookupRegistry } from '../data-grid-lookup-registry';
import { TdItemComponent } from './td-item.component';

describe('TdItemComponent lookup safety net', () => {
  let component: TdItemComponent;
  let fixture: ComponentFixture<TdItemComponent>;
  let getValue: jasmine.Spy;
  let registry: GridLookupRegistry;

  const flushAsyncWork = async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  };

  beforeEach(async () => {
    getValue = jasmine.createSpy('getValue');

    await TestBed.configureTestingModule({
      imports: [TdItemComponent],
      providers: [
        GridLookupRegistry,
        {
          provide: AnagraficaService,
          useValue: {
            getElenco: jasmine.createSpy('getElenco').and.returnValue(of([])),
            getValue,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TdItemComponent);
    component = fixture.componentInstance;
    registry = TestBed.inject(GridLookupRegistry);
    component.colProperty = {
      colAlignment: 'left',
      dataField: 'categoryId',
      dataOptions: {},
      editorbuttons: [],
      customizedOptions: {
        dataSource: '/categories',
        valueExpr: 'id',
        displayExpr: 'name',
      },
    };
    component.colType = 'campo';
    component.value = 'CAT-1';
    component.rowIndex = 0;
    component.dataRow = [{ categoryId: 'CAT-1' }] as any;
  });

  it('should keep the new lookup provider contract backend-neutral', async () => {
    const row = { categoryId: 'CAT-1' };
    const resolved = { id: 'CAT-1', name: 'Categoria 1' };
    const load = jasmine.createSpy('load').and.resolveTo(resolved);
    const provider: GridLookupDataProvider<typeof resolved, string, typeof row> = {
      load,
    };

    const result = await provider.load({
      value: 'CAT-1',
      rowData: row,
      dataField: 'categoryId',
    });

    expect(load).toHaveBeenCalledOnceWith({
      value: 'CAT-1',
      rowData: row,
      dataField: 'categoryId',
    });
    expect(result).toBe(resolved);
  });

  it('should preserve the historical manual remote lookup and displayExpr rendering', async () => {
    getValue.and.resolveTo({ id: 'CAT-1', name: 'Categoria 1' });

    await component.renderDataColumn(component.value, component.colProperty.customizedOptions);

    expect(getValue).toHaveBeenCalledOnceWith('/categories', 'CAT-1', '');
    expect(component.remoteData).toEqual({ id: 'CAT-1', name: 'Categoria 1' });
    expect(component.staticData).toBe('Categoria 1');
  });

  it('should preserve historical items unwrapping in the manual lookup path', async () => {
    getValue.and.resolveTo({
      items: { id: 'CAT-1', name: 'Categoria da items' },
    });

    await component.renderDataColumn(component.value, component.colProperty.customizedOptions);

    expect(component.remoteData).toEqual({ id: 'CAT-1', name: 'Categoria da items' });
    expect(component.staticData).toBe('Categoria da items');
  });

  it('should not automatically start a remote lookup only because customizedOptions exists', () => {
    getValue.and.resolveTo({ id: 'CAT-1', name: 'Categoria 1' });

    component.ngAfterViewInit();

    expect(getValue).not.toHaveBeenCalled();
    expect(component.staticData).toBe('CAT-1');
  });

  it('should keep the raw value when the column does not explicitly opt in to a registry lookup', async () => {
    const load = jasmine.createSpy('load').and.resolveTo({ id: 'CAT-1', name: 'Categoria 1' });
    registry.setProviders({ categoryId: { load } });

    component.ngAfterViewInit();
    await flushAsyncWork();

    expect(load).not.toHaveBeenCalled();
    expect(component.staticData).toBe('CAT-1');
  });

  it('should resolve an opted-in registry lookup and preserve displayExpr rendering', async () => {
    const row = { categoryId: 'CAT-1', productName: 'Giacca' };
    const load = jasmine.createSpy('load').and.resolveTo({ id: 'CAT-1', name: 'Categoria 1' });

    component.colProperty.customizedOptions.lookup = true;
    registry.setProviders({ categoryId: { load } });
    registry.setRowResolver(() => row);

    component.ngAfterViewInit();
    await flushAsyncWork();

    expect(load).toHaveBeenCalledOnceWith({
      value: 'CAT-1',
      rowData: row,
      dataField: 'categoryId',
    });
    expect(component.remoteData).toEqual({ id: 'CAT-1', name: 'Categoria 1' });
    expect(component.displayExpr).toBe('name');
    expect(component.staticData).toBe('Categoria 1');
  });

  it('should allow an explicit registry provider key without tying the cell to a backend', async () => {
    const load = jasmine.createSpy('load').and.resolveTo({ code: 'CAT-1', description: 'Categoria condivisa' });

    component.colProperty.customizedOptions.lookup = {
      providerKey: 'categories',
      displayExpr: 'description',
    };
    registry.setProviders({ categories: { load } });

    component.ngAfterViewInit();
    await flushAsyncWork();

    expect(load).toHaveBeenCalledOnceWith({
      value: 'CAT-1',
      rowData: undefined,
      dataField: 'categoryId',
    });
    expect(component.staticData).toBe('Categoria condivisa');
  });

  it('should preserve the already-rendered raw value when a registry provider fails', async () => {
    const load = jasmine.createSpy('load').and.rejectWith(new Error('lookup failed'));

    component.colProperty.customizedOptions.lookup = true;
    registry.setProviders({ categoryId: { load } });

    component.ngAfterViewInit();
    await flushAsyncWork();

    expect(load).toHaveBeenCalledTimes(1);
    expect(component.staticData).toBe('CAT-1');
    expect(component.remoteData).toBeUndefined();
  });
});
