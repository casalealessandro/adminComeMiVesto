import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AnagraficaService } from '../../services/anagrafica.service';
import { GridDataProvider, GridLoadRequest } from './data-grid-provider';
import { ProviderDataGridComponent } from './provider-data-grid.component';

describe('ProviderDataGridComponent global search', () => {
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
    component.idTable = 'provider-search-grid-test';
    component.tableWidth = 640;
    component.tableWrapWidth = 640;
    component.remoteOperation = true;
    component.providerScrollLoadDelay = 0;
    component.providerSearchDebounce = 0;
    component.colsHeader = [
      { dataField: 'name', type: 'campo' } as any,
      { dataField: 'age', type: 'campoNumber' } as any,
      { dataField: 'active', type: 'campoBoolean' } as any,
      { dataField: '', type: 'editorButtons' } as any,
    ];
  });

  it('should translate one global text value into typed provider search conditions', async () => {
    const requests: GridLoadRequest[] = [];
    component.dataProvider = {
      load: async request => {
        requests.push(request);
        return {
          items: [{ id: 1, name: '35', age: 35 }],
          hasMore: false,
          totalCount: 1,
        };
      },
    };

    const loaded = await component.applyProviderSearch('35');

    expect(loaded).toBeTrue();
    expect(requests).toEqual([{
      pageSize: 20,
      search: {
        value: '35',
        conditions: [
          { field: 'name', operator: 'contains', value: '35' },
          { field: 'age', operator: 'eq', value: 35 },
        ],
      },
    }]);
    expect(component.rowsData()).toEqual([{ id: 1, name: '35', age: 35 }]);
  });

  it('should clear the global search and restart from the first remote page', async () => {
    const requests: GridLoadRequest[] = [];
    component.dataProvider = {
      load: async request => {
        requests.push(request);
        return {
          items: [{ id: requests.length, name: 'Row' }],
          hasMore: false,
          totalCount: 1,
        };
      },
    };

    await component.applyProviderSearch('Anna');
    component.currentPage = 4;
    component.latestSkipLoaded = 80;
    component.latestScrollTopPosition = 150;
    component.remoteContinuation = 'old-search-page';

    const loaded = await component.applyProviderSearch('');

    expect(loaded).toBeTrue();
    expect(requests[1]).toEqual({ pageSize: 20 });
    expect(component.currentPage).toBe(0);
    expect(component.latestSkipLoaded).toBe(0);
    expect(component.latestScrollTopPosition).toBe(0);
  });

  it('should preserve the active global search on continuation pages', async () => {
    component.pageSize = 2;
    const requests: GridLoadRequest[] = [];

    component.dataProvider = {
      load: async request => {
        requests.push(request);
        if (requests.length === 1) {
          return {
            items: [
              { id: 1, name: 'Anna' },
              { id: 2, name: 'Annabella' },
            ],
            hasMore: true,
            continuation: 'search-page-2',
            totalCount: 4,
          };
        }

        return {
          items: [
            { id: 3, name: 'Anne' },
            { id: 4, name: 'Annalisa' },
          ],
          hasMore: false,
          totalCount: 4,
        };
      },
    };

    await component.applyProviderSearch('Ann');
    await component.loadNextRemotePage();

    const search = {
      value: 'Ann',
      conditions: [
        { field: 'name', operator: 'contains' as const, value: 'Ann' },
      ],
    };

    expect(requests).toEqual([
      { pageSize: 2, search },
      { pageSize: 2, continuation: 'search-page-2', search },
    ]);
  });

  it('should combine the active global search with remote sorting without changing either semantic', async () => {
    const requests: GridLoadRequest[] = [];
    component.dataProvider = {
      load: async request => {
        requests.push(request);
        return { items: [{ id: 1, name: 'Anna' }], hasMore: false };
      },
    };

    component.sortColumn('name');
    await new Promise(resolve => setTimeout(resolve, 0));
    await component.applyProviderSearch('Ann');

    expect(requests[1]).toEqual({
      pageSize: 20,
      search: {
        value: 'Ann',
        conditions: [
          { field: 'name', operator: 'contains', value: 'Ann' },
        ],
      },
      sort: [{ field: 'name', direction: 'asc' }],
    });
  });

  it('should restore the previous active search if a replacement search request fails', async () => {
    const requests: GridLoadRequest[] = [];
    let failNext = false;

    component.pageSize = 1;
    component.dataProvider = {
      load: async request => {
        requests.push(request);
        if (failNext) {
          failNext = false;
          throw new Error('search failed');
        }

        return {
          items: [{ id: requests.length, name: 'Existing' }],
          hasMore: true,
          continuation: 'next',
          totalCount: 2,
        };
      },
    };

    await component.applyProviderSearch('Old');
    const existingRows = component.rowsData();

    failNext = true;
    const loaded = await component.applyProviderSearch('New');

    expect(loaded).toBeFalse();
    expect(component.rowsData()).toEqual(existingRows);

    await component.loadNextRemotePage();
    expect(requests[2].search).toEqual({
      value: 'Old',
      conditions: [
        { field: 'name', operator: 'contains', value: 'Old' },
      ],
    });
  });

  it('should preserve the historic debounce entry point for toolbar search', async () => {
    component.providerSearchDebounce = 10;
    component.dataProvider = {
      load: jasmine.createSpy('load').and.resolveTo({ items: [], hasMore: false }),
    };
    const applySearch = spyOn(component, 'applyProviderSearch').and.resolveTo(true);

    component.toolbarValueChanged({ value: 'Anna', event: null });

    expect(component.searchText).toBe('Anna');
    expect(applySearch).not.toHaveBeenCalled();

    await new Promise(resolve => setTimeout(resolve, 15));
    expect(applySearch).toHaveBeenCalledOnceWith('Anna');
  });
});
