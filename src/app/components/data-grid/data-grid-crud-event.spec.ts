import {
  buildGridCreateEvent,
  buildGridDeleteEvent,
  buildGridUpdateEvent,
} from './data-grid-crud-event';

describe('DataGrid CRUD events', () => {
  const component = { id: 'grid-component' };
  const context = { idTable: 'grid-test', service: 'test-service', component };

  it('builds create events with the historic name and default cancel state', () => {
    expect(buildGridCreateEvent(context, 'addRow')).toEqual({
      name: 'buttonNewRowEvent', operation: 'create', cancel: false,
      idTable: 'grid-test', service: 'test-service', component, infoEventButtons: 'addRow',
    });
  });

  it('keeps update data and rowData aligned', () => {
    const row = { code: 'A1', name: 'Prima' };
    const infoEvent = { action: 'onEditEvent' };
    const event = buildGridUpdateEvent(context, 3, row, infoEvent);

    expect(event.name).toBe('buttonEditRowEvent');
    expect(event.operation).toBe('update');
    expect(event.cancel).toBeFalse();
    expect(event.rowIndex).toBe(3);
    expect(event.rowData).toBe(row);
    expect(event.data).toBe(row);
    expect(event.infoEvent).toBe(infoEvent);
  });

  it('builds delete events with the historic delRows name', () => {
    const row = { code: 'D1' };
    const event = buildGridDeleteEvent(context, 1, row);
    expect(event.name).toBe('delRows');
    expect(event.operation).toBe('delete');
    expect(event.rowData).toBe(row);
    expect(event.data).toBe(row);
  });

  it('remains synchronously cancellable', () => {
    const event = buildGridDeleteEvent(context, 0, { code: 'STOP' });
    event.cancel = true;
    expect(event.cancel).toBeTrue();
  });
});
