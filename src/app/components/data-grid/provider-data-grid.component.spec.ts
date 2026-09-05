import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AnagraficaService } from '../../services/anagrafica.service';
import { GridDataProvider, GridLoadRequest, GridPage } from './data-grid-provider';
import { ProviderDataGridComponent } from './provider-data-grid.component';

describe('ProviderDataGridComponent remote loading', () => {
  let component: ProviderDataGridComponent<any>;
  let fixture: ComponentFixture<ProviderDataGridComponent<any>>;

  const anagraficaServiceStub = {
    getElenco: jasmine.createSpy('getElenco').and.returnValue(of([])),
    getValue: jasmine.createSpy('getValue').and.resolveTo(null),
    actionInsert: jasmine.createSpy('actionInsert').and.resolveTo(null),
    actionPut: jasmine.createSpy('actionPut').and.resolveTo(null),
    actionDelete: jasmine.createSpy('actionDelete').and.resolveTo(null),
  };

  const columns = [
    {
      itemType: 'group',
      caption: '',
      colSpan: 1,
      groupDataField: '',
      data: [
        {
          dataField: 'name',
          type: 'campo',
          caption: 'Name',
          colWidth: 120,
          validation: [],
        },
      ],
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProviderDataGridComponent],
      providers: [
        { provide: AnagraficaService, useValue: anagraficaServiceStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProviderDataGridComponent);
    component = fixture.componentInstance;
    component.idTable = 'provider-data-grid-test';
    component.tableWidth = 640;
    component.tableWrapWidth = 640;
    component.colonne = columns as any;
    component.providerScrollLoadDelay = 0;
    anagraficaServiceStub.getElenco.calls.reset();
  });

  it('should load remote rows through the provider without mutating the local input source', async () => {
    const localRows = [{ id: 'local', name: 'Local row' }];
    const remoteRows = [
      { id: '1', name: 'Remote one' },
      { id: '2', name: 'Remote two' },
    ];
    const continuation = { token: 'next-page' };

    const provider: GridDataProvider<any> = {
      load: jasmine.createSpy('load').and.resolveTo({
        items: remoteRows,
        hasMore: true,
        continuation,
        totalCount: 12,
      }),
    };

    fixture.componentRef.setInput('dataSource', localRows);
    component.dataProvider = provider;

    const loaded = await component.loadRemoteRecords();

    expect(loaded).toBeTrue();
    expect(provider.load).toHaveBeenCalledOnceWith({ pageSize: 20 });
    expect(component.rowsData()).toEqual(remoteRows);
    expect(component.totalRecords).toBe(12);
    expect(component.remoteContinuation).toEqual(continuation);
    expect(component.remoteHasMore).toBeTrue();
    expect(component.dataSource()).toBe(localRows);
    expect(anagraficaServiceStub.getElenco).not.toHaveBeenCalled();
  });

  it('should use provider loading only when remoteOperation is enabled', async () => {
    const localRows = [{ id: 'local', name: 'Local row' }];
    const provider: GridDataProvider<any> = {
      load: jasmine.createSpy('load').and.resolveTo({
        items: [{ id: 'remote', name: 'Remote row' }],
        hasMore: false,
      }),
    };

    fixture.componentRef.setInput('dataSource', localRows);
    component.dataProvider = provider;
    component.remoteOperation = false;

    await component.renderGrid();

    expect(provider.load).not.toHaveBeenCalled();
    expect(component.rowsData()).toEqual(localRows);
  });

  it('should use the provider and bypass legacy query-string validation in remote mode', async () => {
    const provider: GridDataProvider<any> = {
      load: jasmine.createSpy('load').and.resolveTo({
        items: [{ id: 'remote', name: 'Remote row' }],
        hasMore: false,
        totalCount: 1,
      }),
    };

    component.dataProvider = provider;
    component.remoteOperation = true;
    component.queryString = '$legacyPlaceholder';
    component.dataJson = undefined;

    await component.renderGrid();

    expect(provider.load).toHaveBeenCalledOnceWith({ pageSize: 20 });
    expect(component.rowsData()).toEqual([{ id: 'remote', name: 'Remote row' }]);
    expect(component.totalRecords).toBe(1);
    expect(anagraficaServiceStub.getElenco).not.toHaveBeenCalled();
  });

  it('should fall back to loaded item count when totalCount is not provided', async () => {
    const page: GridPage<any> = {
      items: [{ id: 1 }, { id: 2 }, { id: 3 }],
      hasMore: false,
    };
    const requests: GridLoadRequest[] = [];
    const provider: GridDataProvider<any> = {
      load: async request => {
        requests.push(request);
        return page;
      },
    };

    component.pageSize = 50;
    component.dataProvider = provider;

    const loaded = await component.loadRemoteRecords();

    expect(loaded).toBeTrue();
    expect(requests).toEqual([{ pageSize: 50 }]);
    expect(component.totalRecords).toBe(3);
    expect(component.remoteHasMore).toBeFalse();
  });

  it('should preserve existing rows when the provider fails', async () => {
    const existingRows = [{ id: 'existing' }];
    component.rowsData.set(existingRows);
    component.dataProvider = {
      load: jasmine.createSpy('load').and.rejectWith(new Error('remote failure')),
    };

    const loaded = await component.loadRemoteRecords();

    expect(loaded).toBeFalse();
    expect(component.rowsData()).toEqual(existingRows);
    expect(component.isLoading).toBeFalse();
  });

  it('should request the next page with the opaque continuation and replace mock rows in place', async () => {
    component.pageSize = 2;
    component.remoteOperation = true;

    const requests: GridLoadRequest[] = [];
    const provider: GridDataProvider<any> = {
      load: async request => {
        requests.push(request);
        if (requests.length === 1) {
          return {
            items: [
              { id: 1, name: 'One' },
              { id: 2, name: 'Two' },
            ],
            hasMore: true,
            continuation: { token: 'page-2' },
            totalCount: 4,
          };
        }

        return {
          items: [
            { id: 3, name: 'Three' },
            { id: 4, name: 'Four' },
          ],
          hasMore: false,
          continuation: undefined,
          totalCount: 4,
        };
      },
    };

    component.dataProvider = provider;
    await component.loadRemoteRecords();
    const loaded = await component.loadNextRemotePage();

    expect(loaded).toBeTrue();
    expect(requests).toEqual([
      { pageSize: 2 },
      { pageSize: 2, continuation: { token: 'page-2' } },
    ]);
    expect(component.rowsData()).toEqual([
      { id: 1, name: 'One' },
      { id: 2, name: 'Two' },
      { id: 3, name: 'Three' },
      { id: 4, name: 'Four' },
    ]);
    expect(component.currentPage).toBe(1);
    expect(component.latestSkipLoaded).toBe(2);
    expect(component.remoteHasMore).toBeFalse();
  });

  it('should expose historic mock rows while the next remote page is loading', async () => {
    component.pageSize = 2;
    component.remoteOperation = true;

    let resolveSecondPage!: (page: GridPage<any>) => void;
    let requestCount = 0;
    const provider: GridDataProvider<any> = {
      load: request => {
        requestCount++;
        if (requestCount === 1) {
          return Promise.resolve({
            items: [
              { id: 1, name: 'One' },
              { id: 2, name: 'Two' },
            ],
            hasMore: true,
            continuation: 'next',
            totalCount: 4,
          });
        }

        return new Promise(resolve => {
          resolveSecondPage = resolve;
        });
      },
    };

    component.dataProvider = provider;
    await component.loadRemoteRecords();

    const nextPagePromise = component.loadNextRemotePage();

    expect(component.isLoading).toBeTrue();
    expect(component.rowsData()).toEqual([
      { id: 1, name: 'One' },
      { id: 2, name: 'Two' },
      { id: null, name: null },
      { id: null, name: null },
    ]);

    resolveSecondPage({
      items: [
        { id: 3, name: 'Three' },
        { id: 4, name: 'Four' },
      ],
      hasMore: false,
      totalCount: 4,
    });

    await nextPagePromise;
    expect(component.rowsData().map(row => row.id)).toEqual([1, 2, 3, 4]);
    expect(component.isLoading).toBeFalse();
  });

  it('should remove mock rows and keep loaded data if the next page fails', async () => {
    component.pageSize = 2;
    component.remoteOperation = true;

    let requestCount = 0;
    component.dataProvider = {
      load: async () => {
        requestCount++;
        if (requestCount === 1) {
          return {
            items: [
              { id: 1, name: 'One' },
              { id: 2, name: 'Two' },
            ],
            hasMore: true,
            continuation: 'next',
            totalCount: 4,
          };
        }
        throw new Error('next page failed');
      },
    };

    await component.loadRemoteRecords();
    const loaded = await component.loadNextRemotePage();

    expect(loaded).toBeFalse();
    expect(component.rowsData()).toEqual([
      { id: 1, name: 'One' },
      { id: 2, name: 'Two' },
    ]);
    expect(component.isLoading).toBeFalse();
  });

  it('should trigger loading only when scrolling near the bottom and moving forward', async () => {
    component.pageSize = 2;
    component.remoteOperation = true;
    component.remoteHasMore = true;
    component.rowsData.set([
      { id: 1, name: 'One' },
      { id: 2, name: 'Two' },
    ]);
    component.dataProvider = {
      load: jasmine.createSpy('load').and.resolveTo({ items: [], hasMore: false }),
    };
    spyOn(component, 'loadNextRemotePage').and.resolveTo(true);

    const scrollTarget = {
      scrollTop: 80,
      scrollHeight: 100,
      clientHeight: 20,
    } as HTMLElement;

    await component.onScroll({ target: scrollTarget } as unknown as Event);

    expect(component.loadNextRemotePage).toHaveBeenCalledTimes(1);
    expect(component.latestScrollTopPosition).toBe(80);
    expect(scrollTarget.scrollTop).toBe(70);
  });

  it('should keep the scrollbar slightly above the bottom while a page is loading', async () => {
    component.dataProvider = {
      load: jasmine.createSpy('load').and.resolveTo({ items: [], hasMore: false }),
    };
    component.isLoading = true;

    const scrollTarget = {
      scrollTop: 80,
      scrollHeight: 100,
      clientHeight: 20,
    } as HTMLElement;

    await component.onScroll({ target: scrollTarget } as unknown as Event);

    expect(scrollTarget.scrollTop).toBe(70);
  });

  it('should not request another page after the provider reports the end', async () => {
    component.pageSize = 2;
    component.remoteOperation = true;
    component.remoteHasMore = false;
    component.rowsData.set([{ id: 1 }, { id: 2 }]);
    component.dataProvider = {
      load: jasmine.createSpy('load').and.resolveTo({ items: [], hasMore: false }),
    };
    spyOn(component, 'loadNextRemotePage').and.resolveTo(true);

    const scrollTarget = {
      scrollTop: 80,
      scrollHeight: 100,
      clientHeight: 20,
    } as HTMLElement;

    await component.onScroll({ target: scrollTarget } as unknown as Event);

    expect(component.loadNextRemotePage).not.toHaveBeenCalled();
  });
});
