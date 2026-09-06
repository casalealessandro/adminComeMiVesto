import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AnagraficaService } from '../../services/anagrafica.service';
import { DataGridComponent } from './data-grid.component';


describe('DataGridComponent local search', () => {
  let component: DataGridComponent;
  let fixture: any;

  const anagraficaServiceStub = {
    getElenco: jasmine.createSpy('getElenco').and.returnValue(of([])),
    getValue: jasmine.createSpy('getValue').and.resolveTo(null),
    actionInsert: jasmine.createSpy('actionInsert').and.resolveTo(null),
    actionPut: jasmine.createSpy('actionPut').and.resolveTo(null),
    actionDelete: jasmine.createSpy('actionDelete').and.resolveTo(null),
  };

  const source = [
    { id: 1, name: 'Giacca Blu', code: 'JK-01', price: 35 },
    { id: 2, name: 'Pantalone', code: 'GIACCA-02', price: 50 },
    { id: 3, name: 'Camicia', code: 'SH-03', price: 135 },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataGridComponent],
      providers: [
        { provide: AnagraficaService, useValue: anagraficaServiceStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DataGridComponent);
    component = fixture.componentInstance;
    component.idTable = 'data-grid-local-search-test';
    component.tableWidth = 640;
    component.tableWrapWidth = 640;
    component.colonne = [];
    component.localSearchDebounce = 0;
    component.colsHeader = [
      { dataField: 'name', type: 'campo' } as any,
      { dataField: 'code', type: 'campo' } as any,
      { dataField: 'price', type: 'campoNumber' } as any,
      { dataField: '', type: 'editorButtons' } as any,
    ];
    fixture.componentRef.setInput('dataSource', source);
    component.rowsData.set([...source]);
  });

  it('should search the input datasource with OR semantics across data fields without mutating it', async () => {
    await component.toolbarValueChanged({ value: 'giacca', event: null });

    expect(component.rowsData()).toEqual([source[0], source[1]]);
    expect(component.dataSource()).toEqual(source);
    expect(component.dataSource().length).toBe(3);
  });

  it('should preserve the historic startsWith searchType when explicitly configured', async () => {
    component.searchType = 'startsWith';

    await component.toolbarValueChanged({ value: 'giacca', event: null });

    expect(component.rowsData()).toEqual([source[0], source[1]]);

    await component.toolbarValueChanged({ value: '35', event: null });

    expect(component.rowsData()).toEqual([source[0]]);
  });

  it('should restore the authoritative input datasource when global search is cleared', async () => {
    await component.toolbarValueChanged({ value: 'camicia', event: null });
    expect(component.rowsData()).toEqual([source[2]]);

    await component.toolbarValueChanged({ value: '', event: null });

    expect(component.rowsData()).toEqual(source);
  });

  it('should filter only the requested column when searchData is called from the filter row', async () => {
    await component.searchData({
      target: {
        dataset: { gridFilterField: 'name' },
        value: 'panta',
        tagName: 'INPUT',
      },
    });

    expect(component.rowsData()).toEqual([source[1]]);
  });

  it('should combine local global search and explicit column filters without changing the input datasource', async () => {
    await component.toolbarValueChanged({ value: '3', event: null });
    expect(component.rowsData()).toEqual([source[0], source[2]]);

    await component.searchData({
      target: {
        dataset: { gridFilterField: 'name' },
        value: 'cam',
        tagName: 'INPUT',
      },
    });

    expect(component.rowsData()).toEqual([source[2]]);
    expect(component.dataSource()).toEqual(source);
  });

  it('should not apply the local datasource filter when base DataGrid is configured for remote operations', async () => {
    component.remoteOperation = true;
    component.rowsData.set([...source]);

    await component.toolbarValueChanged({ value: 'camicia', event: null });

    expect(component.rowsData()).toEqual(source);
  });
});
