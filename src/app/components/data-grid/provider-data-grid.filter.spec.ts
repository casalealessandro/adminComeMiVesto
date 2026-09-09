import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AnagraficaService } from '../../services/anagrafica.service';
import { GridLoadRequest } from './data-grid-provider';
import { ProviderDataGridComponent } from './provider-data-grid.component';

describe('ProviderDataGridComponent column filters', () => {
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
    component.idTable = 'provider-filter-grid-test';
    component.tableWidth = 640;
    component.tableWrapWidth = 640;
    component.remoteOperation = true;
    component.providerScrollLoadDelay = 0;
    component.providerFilterDebounce = 0;
    component.providerSearchDebounce = 0;
    component.colsHeader = [
      { dataField: 'name', type: 'campo' } as any,
      { dataField: 'age', type: 'campoNumber' } as any,
      { dataField: 'active', type: 'campoBoolean' } as any,
      { dataField: 'createdAt', type: 'campoDateTime' } as any,
      {
        dataField: 'categoryId',
        type: 'campoLista',
        customizedOptions: {
          displayExp: 'name',
          valueExp: 'id',
          options: [
            { id: 10, name: 'Donna' },
            { id: 20, name: 'Uomo' },
          ],
        },
      } as any,
    ];
    component.colonne = [
      {
        itemType: 'group',
        caption: '',
        colSpan: 5,
        groupDataField: '',
        data: [
          { dataField: 'name', type: 'campo' },
          { dataField: 'age', type: 'campoNumber' },
          { dataField: 'active', type: 'campoBoolean' },
          { dataField: 'createdAt', type: 'campoDateTime' },
          {
            dataField: 'categoryId',
            type: 'campoLista',
            lista: {
              displayExp: 'name',
              valueExp: 'id',
              options: [
                { id: 10, name: 'Donna' },
                { id: 20, name: 'Uomo' },
              ],
              multiple: false,
              remote: false,
              parent: null,
            },
          },
        ],
      },
    ] as any;
  });

  it('should keep explicit column filters as an AND list in provider requests', async () => {
    const requests: GridLoadRequest[] = [];
    component.dataProvider = {
      load: async request => {
        requests.push(request);
        return { items: [], hasMore: false };
      },
    };

    await component.applyProviderColumnFilter('name', 'ale');
    await component.applyProviderColumnFilter('age', '35');
    await component.applyProviderColumnFilter('active', 'true');

    expect(requests[2]).toEqual({
      pageSize: 20,
      filters: [
        { field: 'name', operator: 'contains', value: 'ale' },
        { field: 'age', operator: 'eq', value: 35 },
        { field: 'active', operator: 'eq', value: true },
      ],
    });
  });

  it('should clear only the selected column filter and restart from the first page', async () => {
    const requests: GridLoadRequest[] = [];
    component.dataProvider = {
      load: async request => {
        requests.push(request);
        return { items: [], hasMore: false };
      },
    };

    await component.applyProviderColumnFilter('name', 'ale');
    await component.applyProviderColumnFilter('age', '35');

    component.currentPage = 3;
    component.latestSkipLoaded = 60;
    component.remoteContinuation = 'old-page';

    await component.applyProviderColumnFilter('name', '');

    expect(requests[2]).toEqual({
      pageSize: 20,
      filters: [
        { field: 'age', operator: 'eq', value: 35 },
      ],
    });
    expect(component.currentPage).toBe(0);
    expect(component.latestSkipLoaded).toBe(0);
  });

  it('should combine column filters with global search and remote sorting', async () => {
    const requests: GridLoadRequest[] = [];
    component.dataProvider = {
      load: async request => {
        requests.push(request);
        return { items: [{ id: 1, name: 'Anna', age: 35 }], hasMore: false };
      },
    };

    await component.applyProviderColumnFilter('age', '35');
    await component.applyProviderSearch('Ann');
    component.sortColumn('name');
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(requests[2]).toEqual({
      pageSize: 20,
      search: {
        value: 'Ann',
        conditions: [
          { field: 'name', operator: 'contains', value: 'Ann' },
        ],
      },
      filters: [
        { field: 'age', operator: 'eq', value: 35 },
      ],
      sort: [{ field: 'name', direction: 'asc' }],
    });
  });

  it('should preserve active column filters on continuation pages', async () => {
    component.pageSize = 2;
    const requests: GridLoadRequest[] = [];

    component.dataProvider = {
      load: async request => {
        requests.push(request);
        if (requests.length === 1) {
          return {
            items: [{ id: 1, age: 35 }, { id: 2, age: 35 }],
            hasMore: true,
            continuation: 'filtered-page-2',
            totalCount: 4,
          };
        }

        return {
          items: [{ id: 3, age: 35 }, { id: 4, age: 35 }],
          hasMore: false,
          totalCount: 4,
        };
      },
    };

    await component.applyProviderColumnFilter('age', '35');
    await component.loadNextRemotePage();

    const filters = [{ field: 'age', operator: 'eq' as const, value: 35 }];
    expect(requests).toEqual([
      { pageSize: 2, filters },
      { pageSize: 2, continuation: 'filtered-page-2', filters },
    ]);
  });

  it('should restore previous filters if a replacement filter request fails', async () => {
    const requests: GridLoadRequest[] = [];
    let failNext = false;

    component.dataProvider = {
      load: async request => {
        requests.push(request);
        if (failNext) {
          failNext = false;
          throw new Error('filter failed');
        }

        return {
          items: [{ id: 1, age: 35 }],
          hasMore: true,
          continuation: 'next',
          totalCount: 2,
        };
      },
    };

    await component.applyProviderColumnFilter('age', '35');
    const existingRows = component.rowsData();

    failNext = true;
    const loaded = await component.applyProviderColumnFilter('age', '40');

    expect(loaded).toBeFalse();
    expect(component.rowsData()).toEqual(existingRows);

    await component.loadNextRemotePage();
    expect(requests[2].filters).toEqual([
      { field: 'age', operator: 'eq', value: 35 },
    ]);
  });

  it('should recover the typed value of a static list filter from its historic lista options', async () => {
    const requests: GridLoadRequest[] = [];
    component.dataProvider = {
      load: async request => {
        requests.push(request);
        return { items: [], hasMore: false };
      },
    };

    const target = document.createElement('select');
    target.dataset['gridFilterField'] = 'categoryId';
    const option = document.createElement('option');
    option.value = '20';
    option.selected = true;
    target.appendChild(option);

    await component.searchData({ target });

    expect(requests[0]).toEqual({
      pageSize: 20,
      filters: [
        { field: 'categoryId', operator: 'eq', value: 20 },
      ],
    });
  });

  it('should keep global search independent from showFilter', async () => {
    component.showFilter = false;
    const requests: GridLoadRequest[] = [];
    component.dataProvider = {
      load: async request => {
        requests.push(request);
        return { items: [], hasMore: false };
      },
    };

    await component.applyProviderSearch('Anna');

    expect(requests[0].search).toEqual({
      value: 'Anna',
      conditions: [
        { field: 'name', operator: 'contains', value: 'Anna' },
      ],
    });
  });
});
