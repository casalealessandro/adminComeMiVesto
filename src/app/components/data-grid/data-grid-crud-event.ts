export type GridCrudOperation = 'create' | 'update' | 'delete';
export type GridCrudEventName = 'buttonNewRowEvent' | 'buttonEditRowEvent' | 'delRows';

export interface GridCrudEvent<T = unknown> {
  name: GridCrudEventName;
  operation: GridCrudOperation;
  cancel: boolean;
  rowIndex?: number;
  rowData?: T;
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

export function buildGridCreateEvent(context: GridCrudEventContext, infoEventButtons?: unknown): GridCrudEvent {
  return {
    name: 'buttonNewRowEvent', operation: 'create', cancel: false,
    idTable: context.idTable, service: context.service, component: context.component, infoEventButtons,
  };
}

export function buildGridUpdateEvent<T>(context: GridCrudEventContext, rowIndex: number, rowData: T, infoEvent?: unknown): GridCrudEvent<T> {
  return {
    name: 'buttonEditRowEvent', operation: 'update', cancel: false,
    rowIndex, rowData, data: rowData,
    idTable: context.idTable, service: context.service, component: context.component, infoEvent,
  };
}

export function buildGridDeleteEvent<T>(context: GridCrudEventContext, rowIndex: number, rowData: T): GridCrudEvent<T> {
  return {
    name: 'delRows', operation: 'delete', cancel: false,
    rowIndex, rowData, data: rowData,
    idTable: context.idTable, service: context.service, component: context.component,
  };
}
