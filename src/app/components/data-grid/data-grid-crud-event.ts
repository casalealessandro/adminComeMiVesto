export type GridCrudOperation = 'create' | 'update' | 'delete';

export type GridCrudEventName =
  | 'buttonNewRowEvent'
  | 'buttonEditRowEvent'
  | 'delRows';

/**
 * Shared CRUD event shape for DataGrid actions.
 *
 * Historical event names and fields remain available so existing consumers do
 * not need to be rewritten. New code can rely on `operation`, `cancel` and the
 * normalized `rowData` field across create/update/delete flows.
 */
export interface GridCrudEvent<T = unknown> {
  name: GridCrudEventName;
  operation: GridCrudOperation;
  cancel: boolean;

  rowIndex?: number;
  rowData?: T;

  /**
   * Historical alias used by the edit flow. When row data exists, new event
   * builders keep `data` and `rowData` aligned to the same object.
   */
  data?: T;

  idTable?: unknown;
  service?: unknown;
  component?: unknown;
  infoEvent?: unknown;
  infoEventButtons?: unknown;
}

export interface GridCrudEventContext {
  idTable?: unknown;
  service?: unknown;
  component?: unknown;
}

export function buildGridCreateEvent(
  context: GridCrudEventContext,
  infoEventButtons?: unknown,
): GridCrudEvent {
  return {
    name: 'buttonNewRowEvent',
    operation: 'create',
    cancel: false,
    idTable: context.idTable,
    service: context.service,
    component: context.component,
    infoEventButtons,
  };
}

export function buildGridUpdateEvent<T>(
  context: GridCrudEventContext,
  rowIndex: number,
  rowData: T,
  infoEvent?: unknown,
): GridCrudEvent<T> {
  return {
    name: 'buttonEditRowEvent',
    operation: 'update',
    cancel: false,
    rowIndex,
    rowData,
    data: rowData,
    idTable: context.idTable,
    service: context.service,
    component: context.component,
    infoEvent,
  };
}

export function buildGridDeleteEvent<T>(
  context: GridCrudEventContext,
  rowIndex: number,
  rowData: T,
): GridCrudEvent<T> {
  return {
    name: 'delRows',
    operation: 'delete',
    cancel: false,
    rowIndex,
    rowData,
    data: rowData,
    idTable: context.idTable,
    service: context.service,
    component: context.component,
  };
}
