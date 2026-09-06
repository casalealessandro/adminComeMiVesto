import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AnagraficaService } from '../../../services/anagrafica.service';
import { GridLookupRegistry } from '../data-grid-lookup-registry';
import { ProviderTdItemComponent } from './provider-td-item.component';

describe('ProviderTdItemComponent lookup bridge', () => {
  let component: ProviderTdItemComponent;
  let registry: GridLookupRegistry;

  const anagraficaServiceStub = {
    getElenco: jasmine.createSpy('getElenco').and.returnValue(of([])),
    getValue: jasmine.createSpy('getValue').and.resolveTo(null),
  };

  const flushAsyncWork = async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProviderTdItemComponent],
      providers: [
        GridLookupRegistry,
        { provide: AnagraficaService, useValue: anagraficaServiceStub },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProviderTdItemComponent);
    component = fixture.componentInstance;
    registry = TestBed.inject(GridLookupRegistry);

    component.colProperty = {
      colAlignment: 'left',
      dataField: 'categoryId',
      dataOptions: {},
      editorbuttons: [],
      customizedOptions: {
        displayExpr: 'name',
      },
    };
    component.colType = 'campo';
    component.value = 'CAT-1';
    component.rowIndex = 0;
  });

  it('should keep the raw value when the column does not explicitly opt in', async () => {
    const load = jasmine.createSpy('load').and.resolveTo({ id: 'CAT-1', name: 'Categoria 1' });
    registry.setProviders({ categoryId: { load } });

    component.ngAfterViewInit();
    await flushAsyncWork();

    expect(load).not.toHaveBeenCalled();
    expect(component.staticData).toBe('CAT-1');
  });

  it('should resolve an opted-in lookup and preserve the historical displayExpr rendering', async () => {
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

  it('should allow an explicit provider key without tying the cell to a backend', async () => {
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

  it('should preserve the already rendered raw value when the provider fails', async () => {
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
