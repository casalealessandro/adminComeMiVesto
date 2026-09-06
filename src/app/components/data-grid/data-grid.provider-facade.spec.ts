import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AnagraficaService } from '../../services/anagrafica.service';
import { DataGridComponent } from './data-grid.component';
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
    const fixture = TestBed.createComponent(DataGridComponent<any>);
    const component = fixture.componentInstance;
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
    const fixture = TestBed.createComponent(DataGridComponent<any>);
    const component = fixture.componentInstance;

    component.dataProvider = {
      load: jasmine.createSpy('load').and.resolveTo({ items: [], hasMore: false }),
    };
    component.queryString = '$legacyPlaceholder';
    component.dataJson = undefined;

    await expectAsync(component.buildAndTestQueryString()).toBeResolvedTo(true);
  });
});
