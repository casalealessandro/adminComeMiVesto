import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AnagraficaService } from '../../services/anagrafica.service';
import { GridDataProvider, GridLoadRequest } from './data-grid-provider';
import { ProviderDataGridComponent } from './provider-data-grid.component';

describe('ProviderDataGridComponent CRUD', () => {
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
    component.idTable = 'provider-crud-grid-test';
    component.tableWidth = 640;
    component.tableWrapWidth = 640;
    component.remoteOperation = true;
  });

  it('should create through the provider and reload the first remote page', async () => {
    const created = { key: 'new-row', name: 'Nuova riga' };
    const create = jasmine.createSpy('create').and.resolveTo(created);
    const load = jasmine.createSpy('load').and.resolveTo({
      items: [created],
      hasMore: false,
      totalCount: 1,
    });

    component.dataProvider = { load, create };

    const result = await component.createProviderRow({ name: 'Nuova riga' });

    expect(result).toEqual(created);
    expect(create).toHaveBeenCalledOnceWith({ name: 'Nuova riga' });
    expect(load).toHaveBeenCalledOnceWith({ pageSize: 20 });
    expect(component.rowsData()).toEqual([created]);
    expect(component.totalRecords).toBe(1);
  });

  it('should update through the provider and use the provider result without id assumptions', async () => {
    const row = { code: 'SKU-01', name: 'Prima' };
    const updated = { code: 'SKU-01', name: 'Aggiornata' };
    const update = jasmine.createSpy('update').and.resolveTo(updated);
    const load = jasmine.createSpy('load').and.resolveTo({
      items: [updated],
      hasMore: false,
    });

    component.dataProvider = { load, update };

    const result = await component.updateProviderRow(row);

    expect(result).toEqual(updated);
    expect(update).toHaveBeenCalledOnceWith(row);
    expect(load).toHaveBeenCalledOnceWith({ pageSize: 20 });
    expect(component.rowsData()).toEqual([updated]);
  });

  it('should delete by passing the whole row to the provider and then reload', async () => {
    const row = { code: 'ROW-TO-DELETE', name: 'Da eliminare' };
    const deleteRow = jasmine.createSpy('delete').and.resolveTo();
    const load = jasmine.createSpy('load').and.resolveTo({
      items: [],
      hasMore: false,
      totalCount: 0,
    });

    component.rowsData.set([row]);
    component.dataProvider = { load, delete: deleteRow };

    const deleted = await component.deleteProviderRow(row);

    expect(deleted).toBeTrue();
    expect(deleteRow).toHaveBeenCalledOnceWith(row);
    expect(load).toHaveBeenCalledOnceWith({ pageSize: 20 });
    expect(component.rowsData()).toEqual([]);
  });

  it('should preserve active search filters and sort when a mutation refreshes the grid', async () => {
    const requests: GridLoadRequest[] = [];
    const update = jasmine.createSpy('update').and.callFake(async row => row);
    const provider: GridDataProvider<any> = {
      load: async request => {
        requests.push(request);
        return { items: [{ name: 'Anna', active: true }], hasMore: false };
      },
      update,
    };

    component.colonne = [
      {
        itemType: 'group',
        caption: '',
        colSpan: 2,
        groupDataField: '',
        data: [
          { dataField: 'name', type: 'campo', caption: 'Nome', colWidth: 180, validation: [] },
          { dataField: 'active', type: 'campoBoolean', caption: 'Stato', colWidth: 100, validation: [] },
        ],
      },
    ] as any;
    component.colsHeader = [
      { dataField: 'name', type: 'campo' } as any,
      { dataField: 'active', type: 'campoBoolean' } as any,
    ];
    component.dataProvider = provider;

    await component.applyProviderSearch('Ann');
    await component.applyProviderColumnFilter('active', true);
    component.sortColumn('name');
    await new Promise(resolve => setTimeout(resolve, 0));

    requests.length = 0;
    await component.updateProviderRow({ name: 'Anna', active: true });

    expect(requests).toEqual([{
      pageSize: 20,
      search: {
        value: 'Ann',
        conditions: [
          { field: 'name', operator: 'contains', value: 'Ann' },
        ],
      },
      filters: [
        { field: 'active', operator: 'eq', value: true },
      ],
      sort: [
        { field: 'name', direction: 'asc' },
      ],
    }]);
  });

  it('should not mutate or reload rows when a provider mutation fails', async () => {
    const existingRows = [{ code: 'KEEP', name: 'Esistente' }];
    const create = jasmine.createSpy('create').and.rejectWith(new Error('create failed'));
    const load = jasmine.createSpy('load').and.resolveTo({ items: [], hasMore: false });

    component.rowsData.set(existingRows);
    component.dataProvider = { load, create };

    const result = await component.createProviderRow({ name: 'Fallisce' });

    expect(result).toBeUndefined();
    expect(component.rowsData()).toEqual(existingRows);
    expect(load).not.toHaveBeenCalled();
    expect(component.isLoading).toBeFalse();
  });

  it('should leave optional CRUD disabled when the provider does not expose mutation methods', async () => {
    const load = jasmine.createSpy('load').and.resolveTo({ items: [], hasMore: false });
    component.dataProvider = { load };

    expect(await component.createProviderRow({ name: 'A' })).toBeUndefined();
    expect(await component.updateProviderRow({ name: 'B' })).toBeUndefined();
    expect(await component.deleteProviderRow({ name: 'C' })).toBeFalse();
    expect(load).not.toHaveBeenCalled();
  });
});
