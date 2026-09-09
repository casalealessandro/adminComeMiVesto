import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AnagraficaService } from '../../services/anagrafica.service';
import { DataGridComponent } from './data-grid.component';

describe('DataGridComponent keyboard navigation', () => {
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
    component.idTable = 'data-grid-keyboard-test';
    component.tableWidth = 640;
    component.tableWrapWidth = 640;
    component.colonne = [];
  });

  it('should move down across the currently rendered rows and keep the historical event payload', () => {
    const rows = [
      { id: 1, name: 'Uno' },
      { id: 2, name: 'Due' },
    ];
    component.selectionRowMode = 'single';
    component.rowsData.set(rows);
    component.selectedRowIndex = 0;
    component.selectedSubRowIndex = -1;
    component.showDetailRow = [false, false];

    const emitted: any[] = [];
    component.emittendSelectionRow.subscribe(event => emitted.push(event));

    component.navigateByKeyboard('ArrowDown');

    expect(component.selectedRowIndex).toBe(1);
    expect(component.selectedSubRowIndex).toBe(-1);
    expect(emitted).toEqual([
      jasmine.objectContaining({
        name: 'onRowSelectionChange',
        keyPressed: 'ArrowDown',
        data: rows[1],
        rowIndex: -1,
        infoRows: {
          isRowFather: false,
          isRowDetail: false,
        },
      }),
    ]);
  });

  it('should preserve the historical first-row ArrowUp index in single selection mode', () => {
    const row = { id: 1, name: 'Uno' };
    component.selectionRowMode = 'single';
    component.rowsData.set([row]);
    component.selectedRowIndex = 0;
    component.selectedSubRowIndex = -1;

    const emitted: any[] = [];
    component.emittendSelectionRow.subscribe(event => emitted.push(event));

    component.navigateByKeyboard('ArrowUp');

    expect(component.selectedRowIndex).toBe(0);
    expect(component.selectedSubRowIndex).toBe(0);
    expect(emitted[0]).toEqual(jasmine.objectContaining({
      name: 'onRowSelectionChange',
      keyPressed: 'ArrowUp',
      data: row,
      rowIndex: 0,
    }));
  });

  it('should enter the first open detail row with ArrowDown as before', () => {
    const detailRows = [
      { id: 'D1', name: 'Dettaglio 1' },
      { id: 'D2', name: 'Dettaglio 2' },
    ];
    component.selectionRowMode = 'detail';
    component.rowsData.set([{ id: 1 }]);
    component.selectedRowIndex = 0;
    component.selectedSubRowIndex = -1;
    component.showDetailRow = [true];
    component.colsRowDetail = [detailRows];

    const emitted: any[] = [];
    component.emittendSelectionRow.subscribe(event => emitted.push(event));

    component.navigateByKeyboard('ArrowDown');

    expect(component.selectedSubRowIndex).toBe(0);
    expect(emitted[0]).toEqual(jasmine.objectContaining({
      name: 'onRowSelectionChange',
      keyPressed: 'ArrowDown',
      data: detailRows[0],
      rowIndex: 0,
      infoRows: {
        isRowFather: false,
        isRowDetail: true,
      },
    }));
  });

  it('should not throw or emit a false selection when detail data is not available', () => {
    component.selectionRowMode = 'detail';
    component.rowsData.set([{ id: 1 }]);
    component.selectedRowIndex = 0;
    component.selectedSubRowIndex = -1;
    component.showDetailRow = [false];
    component.colsRowDetail = [];

    const emitted: any[] = [];
    component.emittendSelectionRow.subscribe(event => emitted.push(event));

    expect(() => component.navigateByKeyboard('ArrowDown')).not.toThrow();
    expect(emitted).toEqual([]);
  });
});
