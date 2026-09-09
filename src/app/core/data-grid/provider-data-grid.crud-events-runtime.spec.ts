import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { AnagraficaService } from '../../services/anagrafica.service';
import { GridCrudEvent } from './data-grid-crud-event';
import { ProviderDataGridComponent } from './provider-data-grid.component';

describe('ProviderDataGridComponent typed CRUD event wiring', () => {
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
    component.idTable = 'provider-crud-event-grid-test';
    component.tableWidth = 640;
    component.tableWrapWidth = 640;
    component.service = 'test-service';
    component.dataProvider = {
      load: async () => ({ items: [], hasMore: false }),
    };
  });

  afterEach(() => {
    document.querySelectorAll('.modal').forEach(modal => modal.remove());
  });

  it('should preserve the historic create emit order with the typed create payload', () => {
    const emitted: Array<{ output: string; event: GridCrudEvent }> = [];

    component.emittendToolbarClick.subscribe(event => emitted.push({ output: 'toolbar', event }));
    component.emittendStartEdit.subscribe(event => emitted.push({ output: 'edit', event }));

    component.buttonEmitted('addRow');

    expect(emitted.length).toBe(2);
    expect(emitted[0].output).toBe('toolbar');
    expect(emitted[1].output).toBe('edit');
    expect(emitted[0].event).toBe(emitted[1].event);
    expect(emitted[0].event.name).toBe('buttonNewRowEvent');
    expect(emitted[0].event.operation).toBe('create');
    expect(emitted[0].event.cancel).toBeFalse();
    expect(emitted[0].event.idTable).toBe('provider-crud-event-grid-test');
    expect(emitted[0].event.service).toBe('test-service');
    expect(emitted[0].event.component).toBe(component);
  });

  it('should preserve the historic external edit flow with aligned data and rowData', () => {
    const row = { code: 'A1', name: 'Prima' };
    let emitted!: GridCrudEvent<any>;

    component.rowsData.set([row]);
    component.emittendStartEdit.subscribe(event => emitted = event);

    component.startEdit(0, { action: 'onEditEvent' });

    expect(emitted.name).toBe('buttonEditRowEvent');
    expect(emitted.operation).toBe('update');
    expect(emitted.cancel).toBeFalse();
    expect(emitted.rowIndex).toBe(0);
    expect(emitted.rowData).toBe(row);
    expect(emitted.data).toBe(row);
    expect(emitted.component).toBe(component);
  });

  it('should emit typed delRows and keep local delete behavior when remoteOperation is false', async () => {
    const row = { code: 'LOCAL-1', name: 'Locale' };
    let emitted!: GridCrudEvent<any>;
    const deleteRow = spyOn(component, 'deleteRow').and.returnValue([]);

    component.remoteOperation = false;
    component.rowsData.set([row]);
    component.emittendGridEvent.subscribe(event => emitted = event);

    await component.removeRowData(0, { action: 'onDeleteEvent' });
    clickConfirmYes();

    expect(emitted.name).toBe('delRows');
    expect(emitted.operation).toBe('delete');
    expect(emitted.cancel).toBeFalse();
    expect(emitted.rowData).toBe(row);
    expect(emitted.data).toBe(row);
    expect(deleteRow).toHaveBeenCalledOnceWith(0);
  });

  it('should allow the local parent to cancel delete synchronously without changing the default', async () => {
    const row = { code: 'STOP', name: 'Non eliminare' };
    const deleteRow = spyOn(component, 'deleteRow').and.returnValue([]);

    component.remoteOperation = false;
    component.rowsData.set([row]);
    component.emittendGridEvent.subscribe((event: GridCrudEvent<any>) => {
      event.cancel = true;
    });

    await component.removeRowData(0, { action: 'onDeleteEvent' });
    clickConfirmYes();

    expect(deleteRow).not.toHaveBeenCalled();
  });

  it('should not emit delRows in provider remote mode and should delegate delete to the provider', async () => {
    const row = { code: 'REMOTE-1', name: 'Remota' };
    const deleteProvider = jasmine.createSpy('delete').and.resolveTo();
    const load = jasmine.createSpy('load').and.resolveTo({ items: [], hasMore: false, totalCount: 0 });
    const gridEvent = jasmine.createSpy('gridEvent');

    component.remoteOperation = true;
    component.rowsData.set([row]);
    component.dataProvider = {
      load,
      delete: deleteProvider,
    };
    component.emittendGridEvent.subscribe(gridEvent);

    await component.removeRowData(0, { action: 'onDeleteEvent' });
    clickConfirmYes();
    await Promise.resolve();
    await Promise.resolve();

    expect(gridEvent).not.toHaveBeenCalled();
    expect(deleteProvider).toHaveBeenCalledOnceWith(row);
    expect(load).toHaveBeenCalledOnceWith({ pageSize: 20 });
  });

  function clickConfirmYes(): void {
    const buttons = document.querySelectorAll<HTMLButtonElement>('.ui-modal-footer-message .ui-modal-button');
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent).toBe('Si');
    buttons[0].click();
  }
});
