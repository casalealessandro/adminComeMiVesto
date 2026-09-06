import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AnagraficaService } from '../../services/anagrafica.service';
import { DataGridComponent } from './data-grid.component';

describe('DataGridComponent cell button contract', () => {
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
    component.idTable = 'data-grid-button-click-test';
    component.tableWidth = 640;
    component.tableWrapWidth = 640;
    component.colonne = [];
  });

  it('should emit the corrected cell button output without mutating button configuration', () => {
    const rows = [
      { id: 1, status: 'pending' },
      { id: 2, status: 'pending' },
    ];
    fixture.componentRef.setInput('dataSource', rows);
    component.rowsData.set(rows);

    const button = {
      text: '',
      name: 'approve',
      event: 'approve',
      icon: 'mdi mdi-check',
      hint: 'Approva',
    };
    const originalButton = { ...button };
    const col = { type: 'campoButton', button };
    const domEvent = {
      stopPropagation: jasmine.createSpy('stopPropagation'),
      preventDefault: jasmine.createSpy('preventDefault'),
    };

    const emitted: any[] = [];
    component.emittendButtonCellClick.subscribe(event => emitted.push(event));

    component.buttonClick(domEvent, button, col, 1);

    expect(emitted.length).toBe(1);
    expect(emitted[0]).not.toBe(button);
    expect(emitted[0]).toEqual(jasmine.objectContaining({
      name: 'approve',
      dataSource: rows,
      rowData: rows[1],
      col,
      rowIndex: 1,
      component,
      event: domEvent,
    }));
    expect(button).toEqual(originalButton);
    expect(button.event).toBe('approve');
    expect(domEvent.stopPropagation).toHaveBeenCalledTimes(1);
    expect(domEvent.preventDefault).toHaveBeenCalledTimes(1);
  });
});
