import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { DataGridComponent } from './data-grid.component';
import { AnagraficaService } from '../../services/anagrafica.service';


describe('DataGridComponent local behavior', () => {
  let component: DataGridComponent;
  let fixture: ComponentFixture<DataGridComponent>;

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

    fixture = TestBed.createComponent(DataGridComponent);
    component = fixture.componentInstance;
    component.idTable = 'data-grid-test';
    component.tableWidth = 640;
    component.tableWrapWidth = 640;
    component.colonne = [];
    fixture.detectChanges();
  });

  it('should sort local rows and toggle sort direction', () => {
    component.rowsData.set([
      { name: 'Carlo' },
      { name: 'Anna' },
      { name: 'Bruno' },
    ]);

    component.sortColumn('name');
    expect(component.rowsData().map(row => row.name)).toEqual(['Anna', 'Bruno', 'Carlo']);
    expect(component.sortDirection).toBe('asc');

    component.sortColumn('name');
    expect(component.rowsData().map(row => row.name)).toEqual(['Carlo', 'Bruno', 'Anna']);
    expect(component.sortDirection).toBe('desc');
  });

  it('should select and clear all currently loaded rows', () => {
    component.rowsData.set([
      { id: 1 },
      { id: 2 },
      { id: 3 },
    ]);

    component.clickToSelectAllRows();
    expect(component.rowSelected.slice(0, 3)).toEqual([true, true, true]);
    expect(component.rowSelectedAll).toBeTrue();

    component.clickToSelectAllRows();
    expect(component.rowSelected).toEqual([false]);
    expect(component.rowSelectedAll).toBeFalse();
  });

  it('should calculate summaries only for configured columns', () => {
    component.rowsData.set([
      { amount: 10, ignored: 100 },
      { amount: 15, ignored: 200 },
    ]);
    component.colsHeader = [
      { dataField: 'amount', showInSummary: true } as any,
      { dataField: 'ignored', showInSummary: false } as any,
    ];

    component.calcSommaryCells();

    expect(component.valueSumm['amount']).toBe(25);
    expect(component.valueSumm['ignored']).toBeUndefined();
  });

  it('should build configured data columns and editor actions', async () => {
    const columns = [
      {
        itemType: 'group',
        caption: '',
        colSpan: 2,
        groupDataField: '',
        data: [
          {
            dataField: 'name',
            type: 'campo',
            caption: 'Name',
            colWidth: 120,
            validation: [],
          },
          {
            dataField: 'age',
            type: 'campoNumber',
            caption: 'Age',
            colWidth: 80,
            validation: [],
          },
        ],
      },
    ];

    await component.buildHeaderColumns(columns as any);

    expect(component.colsHeader.some(column => column.dataField === 'name')).toBeTrue();
    expect(component.colsHeader.some(column => column.dataField === 'age')).toBeTrue();
    expect(component.colsHeader.some(column => column.type === 'editorButtons')).toBeTrue();
  });
});
