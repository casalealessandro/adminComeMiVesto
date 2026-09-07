import {
  buildGridCreateEvent,
  buildGridDeleteEvent,
  buildGridUpdateEvent,
} from './data-grid-crud-event';

describe('DataGrid CRUD events', () => {
  const component = { id: 'grid-component' };
  const context = {
    idTable: 'grid-test',
    service: 'test-service',
    component,
  };

  it('should build create events with the historic name and cancel disabled by default', () => {
    const event = buildGridCreateEvent(context, 'addRow');

    expect(event).toEqual({
      name: 'buttonNewRowEvent',
      operation: 'create',
      cancel: false,
      idTable: 'grid-test',
      service: 'test-service',
      component,
      infoEventButtons: 'addRow',
    });
  });

  it('should keep update data and rowData aligned to the same row', () => {
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
    expect(event.component).toBe(component);
  });

  it('should build delete events with the historic delRows name and a cancellable payload', () => {
    const row = { code: 'D1', name: 'Da eliminare' };

    const event = buildGridDeleteEvent(context, 1, row);

    expect(event.name).toBe('delRows');
    expect(event.operation).toBe('delete');
    expect(event.cancel).toBeFalse();
    expect(event.rowIndex).toBe(1);
    expect(event.rowData).toBe(row);
    expect(event.data).toBe(row);
  });

  it('should remain synchronously cancellable by a parent consumer', () => {
    const event = buildGridDeleteEvent(context, 0, { code: 'STOP' });

    event.cancel = true;

    expect(event.cancel).toBeTrue();
  });
});
