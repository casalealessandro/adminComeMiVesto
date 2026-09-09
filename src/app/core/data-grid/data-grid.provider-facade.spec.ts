import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AnagraficaService } from '../../services/anagrafica.service';
import { DataGridComponent } from './data-grid.component';
import { GridLookupRegistry } from './data-grid-lookup-registry';
import { GridDataProvider } from './data-grid-provider';

describe('DataGridComponent provider facade', () => {
  const anagraficaServiceStub = {
    getElenco: jasmine.createSpy('getElenco').and.returnValue(of([])),
    getValue: jasmine.createSpy('getValue').and.resolveTo(null),
    actionInsert: jasmine.createSpy('actionInsert').and.resolveTo(null),
    actionPut: jasmine.createSpy('actionPut').and.resolveTo(null),
    actionDelete: jasmine.createSpy('actionDelete').and.resolveTo(null),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataGridComponent],
      providers: [
        { provide: AnagraficaService, useValue: anagraficaServiceStub },
      ],
    }).compileComponents();

    anagraficaServiceStub.getElenco.calls.reset();
  });

  it('should load a GridDataProvider directly from DataGridComponent', async () => {
    const fixture = TestBed.createComponent(DataGridComponent);
    const component = fixture.componentInstance as DataGridComponent<any>;
    const localRows = [{ id: 'local', name: 'Local' }];
    const continuation = { token: 'next' };
    const remoteRows = [{ id: 'remote', name: 'Remote' }];

    const provider: GridDataProvider<any> = {
      load: jasmine.createSpy('load').and.resolveTo({
        items: remoteRows,
        hasMore: true,
        continuation,
        totalCount: 4,
      }),
    };

    fixture.componentRef.setInput('dataSource', localRows);
    component.dataProvider = provider;

    const loaded = await component.loadRemoteRecords();

    expect(loaded).toBeTrue();
    expect(provider.load).toHaveBeenCalledOnceWith({ pageSize: 20 });
    expect(component.rowsData()).toEqual(remoteRows);
    expect(component.totalRecords).toBe(4);
    expect(component.remoteContinuation).toEqual(continuation);
    expect(component.remoteHasMore).toBeTrue();
    expect(component.dataSource()).toBe(localRows);
    expect(anagraficaServiceStub.getElenco).not.toHaveBeenCalled();
  });

  it('should bypass legacy query-string validation when a provider is configured', async () => {
    const fixture = TestBed.createComponent(DataGridComponent);
    const component = fixture.componentInstance as DataGridComponent<any>;

    component.dataProvider = {
      load: jasmine.createSpy('load').and.resolveTo({ items: [], hasMore: false }),
    };
    component.queryString = '$legacyPlaceholder';
    component.dataJson = undefined;

    await expectAsync(component.buildAndTestQueryString()).toBeResolvedTo(true);
  });

  it('should own lookup provider wiring and cleanup directly in DataGridComponent', () => {
    const fixture = TestBed.createComponent(DataGridComponent);
    const component = fixture.componentInstance as DataGridComponent<any>;
    const registry = fixture.debugElement.injector.get(GridLookupRegistry);
    const row = { categoryId: 'CAT-1', name: 'Giacca' };
    const lookupProvider = {
      load: jasmine.createSpy('lookupLoad').and.resolveTo({ id: 'CAT-1', name: 'Categoria 1' }),
    };

    component.rowsData.set([row]);
    component.lookupProviders = { categoryId: lookupProvider };

    expect(registry.getProvider('categoryId', true)).toBe(lookupProvider);
    expect(registry.resolveRow(0)).toBe(row);

    fixture.destroy();

    expect(registry.getProvider('categoryId', true)).toBeUndefined();
    expect(registry.resolveRow(0)).toBeUndefined();
  });

  it('should apply provider header metadata after the historical header builder', async () => {
    const fixture = TestBed.createComponent(DataGridComponent);
    const component = fixture.componentInstance as DataGridComponent<any>;
    const column = {
      type: 'campo',
      dataField: 'categoryId',
      caption: 'Categoria',
      colWidth: 120,
      allowFiltering: false,
      customizedOptions: {
        lookup: true,
      },
    } as any;

    component.dataProvider = {
      load: jasmine.createSpy('load').and.resolveTo({ items: [], hasMore: false }),
    };
    component.showFilter = true;
    component.colonne = [column];

    await component.buildHeaderColumns([{
      itemType: 'group',
      caption: '',
      colSpan: 1,
      data: component.colonne,
    }]);

    const builtColumn = component.colsHeader.find(current => current.dataField === 'categoryId');

    expect(builtColumn?.search).toBeFalse();
    expect(builtColumn?.customizedOptions?.lookup).toBeTrue();
  });

  it('should load detail rows directly through the shared detail provider facade', async () => {
    const fixture = TestBed.createComponent(DataGridComponent);
    const component = fixture.componentInstance as DataGridComponent<any>;
    const row = { id: 'ROW-1' };
    const details = [{ id: 'DETAIL-1' }];
    const load = jasmine.createSpy('detailLoad').and.resolveTo(details);
    const emitted: any[] = [];

    component.detailDataProvider = { load };
    component.emittendGridEvent.subscribe(event => emitted.push(event));

    await component.renderGridDetailData(component.detailOptions, row, 0);

    expect(load).toHaveBeenCalledOnceWith({ parentRow: row });
    expect(component.colsRowDetail[0]).toBe(details);
    expect(component.showNullDataDetail).toBeFalse();
    expect(component.showDetailRow[0]).toBeTrue();
    expect(emitted).toEqual([jasmine.objectContaining({
      data: row,
      rowIndex: 0,
      expandedData: details,
      name: 'onRowExpanded',
    })]);
  });
});
