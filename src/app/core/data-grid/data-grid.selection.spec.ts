import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AnagraficaService } from '../../services/anagrafica.service';
import { DataGridComponent } from './data-grid.component';

describe('DataGridComponent multiple selection actions', () => {
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
    component.idTable = 'data-grid-selection-test';
    component.tableWidth = 640;
    component.tableWrapWidth = 640;
    component.colonne = [];
    component.selectionRowMode = 'multiple';
  });

  it('should confirm selected rows and emit the historical selection event', () => {
    component.rowsData.set([
      { id: 1, name: 'Uno' },
      { id: 2, name: 'Due' },
      { id: 3, name: 'Tre' },
    ]);
    component.rowSelected = [true, false, true];

    const emitted: any[] = [];
    component.emittendSelectionRow.subscribe(event => emitted.push(event));

    component.confirmSelectedRows();

    expect(emitted.length).toBe(1);
    expect(emitted[0].name).toBe('onRowMultipleSelectionChange');
    expect(emitted[0].dataSelected).toEqual([
      { id: 1, name: 'Uno' },
      { id: 3, name: 'Tre' },
    ]);
    expect(emitted[0].component).toBe(component);
  });

  it('should keep saveAndExit as a compatibility alias', () => {
    spyOn(component, 'confirmSelectedRows');

    component.saveAndExit();

    expect(component.confirmSelectedRows).toHaveBeenCalledTimes(1);
  });

  it('should clear current multiple selection and emit the clear event', () => {
    component.rowsData.set([
      { id: 1 },
      { id: 2 },
    ]);
    component.rowSelected = [true, true];
    component.rowSelectedAll = true;

    const emitted: any[] = [];
    component.emittendSelectionRow.subscribe(event => emitted.push(event));

    component.clearSelectedRows();

    expect(component.rowSelected).toEqual([false]);
    expect(component.rowSelectedAll).toBeFalse();
    expect(emitted.length).toBe(1);
    expect(emitted[0]).toEqual(jasmine.objectContaining({
      name: 'onRowMultipleSelectionClear',
      dataSelected: [],
      component,
    }));
  });

  it('should keep removeSelAndExit as a compatibility alias', () => {
    const event = { source: 'legacy-toolbar' };
    spyOn(component, 'clearSelectedRows');

    component.removeSelAndExit(event);

    expect(component.clearSelectedRows).toHaveBeenCalledOnceWith(event);
  });

  it('should use the clearer confirm method from the historical toolbar command 22', () => {
    spyOn(component, 'confirmSelectedRows');

    component.buttonEmitted(22);

    expect(component.confirmSelectedRows).toHaveBeenCalledTimes(1);
  });
});
