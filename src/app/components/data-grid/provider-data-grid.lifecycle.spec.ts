import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { of } from 'rxjs';

import { AnagraficaService } from '../../services/anagrafica.service';
import { GridLookupRegistry } from './data-grid-lookup-registry';
import { ProviderDataGridComponent } from './provider-data-grid.component';

describe('ProviderDataGridComponent lookup lifecycle bridge', () => {
  let component: ProviderDataGridComponent<any>;
  let fixture: ComponentFixture<ProviderDataGridComponent<any>>;

  const anagraficaServiceStub = {
    getElenco: jasmine.createSpy('getElenco').and.returnValue(of([])),
    getValue: jasmine.createSpy('getValue').and.resolveTo(null),
    actionInsert: jasmine.createSpy('actionInsert').and.resolveTo(null),
    actionPut: jasmine.createSpy('actionPut').and.resolveTo(null),
    actionDelete: jasmine.createSpy('actionDelete').and.resolveTo(null),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProviderDataGridComponent],
      providers: [
        { provide: AnagraficaService, useValue: anagraficaServiceStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProviderDataGridComponent);
    component = fixture.componentInstance;
  });

  it('should wire lookup providers and row resolution without waiting for view initialization', () => {
    const row = { code: 'ROW-1', categoryId: 'CAT-1' };
    const lookupProvider = {
      load: jasmine.createSpy('load').and.resolveTo({ id: 'CAT-1', name: 'Categoria 1' }),
    };

    component.rowsData.set([row]);
    component.lookupProviders = { categoryId: lookupProvider };

    const registry = fixture.debugElement.injector.get(GridLookupRegistry);

    expect(registry.getProvider('categoryId', true)).toBe(lookupProvider);
    expect(registry.resolveRow(0)).toBe(row);
  });

  it('should keep provider cleanup while inheriting the base destroy lifecycle', fakeAsync(() => {
    const lookupProvider = {
      load: jasmine.createSpy('lookupLoad').and.resolveTo({ id: 'CAT-1', name: 'Categoria 1' }),
    };
    const providerLoad = jasmine.createSpy('providerLoad').and.resolveTo({ items: [], hasMore: false });
    const disconnect = jasmine.createSpy('disconnect');
    const registry = fixture.debugElement.injector.get(GridLookupRegistry);

    component.lookupProviders = { categoryId: lookupProvider };
    component.dataProvider = { load: providerLoad };
    component.remoteOperation = true;
    component.providerSearchDebounce = 10;
    (component as any).resizeObserver = { disconnect };

    void component.toolbarValueChanged({ value: 'pending-search', event: null });

    fixture.destroy();
    tick(20);

    expect(providerLoad).not.toHaveBeenCalled();
    expect(registry.getProvider('categoryId', true)).toBeUndefined();
    expect(disconnect).toHaveBeenCalledTimes(1);
  }));
});
