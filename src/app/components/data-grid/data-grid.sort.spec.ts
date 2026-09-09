import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AnagraficaService } from '../../services/anagrafica.service';
import { DataGridComponent } from './data-grid.component';

describe('DataGridComponent local sorting', () => {
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
    component.idTable = 'data-grid-sort-test';
    component.tableWidth = 640;
    component.tableWrapWidth = 640;
    component.colonne = [];
  });

  it('should sort rendered rows without mutating the input data source order', () => {
    const rows = [
      { id: 1, name: 'Mario' },
      { id: 2, name: 'Anna' },
      { id: 3, name: 'Luca' },
    ];
    const originalRows = [...rows];

    fixture.componentRef.setInput('dataSource', rows);
    component.rowsData.set(rows);

    component.sortColumn('name');

    expect(component.sortedColumn).toBe('name');
    expect(component.sortDirection).toBe('asc');
    expect(component.rowsData().map(row => row.name)).toEqual(['Anna', 'Luca', 'Mario']);
    expect(component.rowsData()).not.toBe(rows);
    expect(component.rowsData()[0]).toBe(rows[1]);
    expect(rows).toEqual(originalRows);

    component.sortColumn('name');

    expect(component.sortDirection).toBe('desc');
    expect(component.rowsData().map(row => row.name)).toEqual(['Mario', 'Luca', 'Anna']);
    expect(rows).toEqual(originalRows);
  });
});
