import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, input } from '@angular/core';
import { ColData, Colonne } from '../../interface/app.interface';

export interface GridRowEvent<T = any> {
  name: string;
  rowData: T;
  data: T;
  rowIndex: number;
  cancel?: boolean;
  event?: Event;
}

@Component({
  selector: 'app-data-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './data-grid.component.html',
  styleUrls: ['./data-grid.component.scss']
})
export class DataGridComponent {
  @Input() idTable: string | number = 'data-grid';
  @Input() colonne: Colonne[] = [];
  @Input() isEditable = false;
  @Input() isEditableEditRow = true;
  @Input() isEditableDeleteRow = true;

  dataSource = input<any[]>([]);

  @Output() emittendSelectionRow = new EventEmitter<GridRowEvent>();
  @Output() emittendDblRowClick = new EventEmitter<GridRowEvent>();
  @Output() emittendGridEvent = new EventEmitter<any>();
  @Output() emittendStartEdit = new EventEmitter<GridRowEvent>();
  @Output() emittendBttonCellClick = new EventEmitter<any>();

  selectedRowIndex: number | null = null;
  sortField: string | null = null;
  sortDirection: 'asc' | 'desc' = 'asc';

  get columns(): ColData[] {
    return this.colonne
      .flatMap(group => group.data ?? [])
      .filter(column => column.colVisible !== false)
      .filter(column => !['campoHidden', 'empty', 'campoDesc', 'detail'].includes(column.type));
  }

  get rows(): any[] {
    const source = this.dataSource() ?? [];
    if (!this.sortField) return source;

    const field = this.sortField;
    const direction = this.sortDirection === 'asc' ? 1 : -1;
    return [...source].sort((left, right) => {
      const a = left?.[field];
      const b = right?.[field];
      if (a === b) return 0;
      if (a === null || a === undefined) return 1;
      if (b === null || b === undefined) return -1;
      return a < b ? -direction : direction;
    });
  }

  trackRow(index: number, row: any): string | number {
    return row?.id ?? row?.uid ?? index;
  }

  caption(column: ColData): string {
    return column.colCaption || column.caption || '';
  }

  width(column: ColData): string | null {
    const value = column.colWidth ?? column.width;
    if (value === undefined || value === null || value === 'auto') return null;
    return typeof value === 'number' ? `${value}px` : /^\d+$/.test(String(value)) ? `${value}px` : String(value);
  }

  selectRow(event: Event, row: any, rowIndex: number): void {
    this.selectedRowIndex = rowIndex;
    this.emittendSelectionRow.emit({
      name: 'onRowOnlyClick',
      rowData: row,
      data: row,
      rowIndex,
      event,
      cancel: false
    });
  }

  doubleClickRow(event: Event, row: any, rowIndex: number): void {
    this.emittendDblRowClick.emit({
      name: 'onDblRowClick',
      rowData: row,
      data: row,
      rowIndex,
      event,
      cancel: false
    });
  }

  editRow(event: Event, row: any, rowIndex: number): void {
    event.stopPropagation();
    this.emittendStartEdit.emit({
      name: 'buttonEditRowEvent',
      rowData: row,
      data: row,
      rowIndex,
      event,
      cancel: false
    });
  }

  deleteRow(event: Event, row: any, rowIndex: number): void {
    event.stopPropagation();
    this.emittendGridEvent.emit({
      name: 'delRows',
      rowData: row,
      data: row,
      rowIndex,
      event
    });
  }

  cellButtonClick(event: Event, column: ColData, row: any, rowIndex: number): void {
    event.stopPropagation();
    const button = column.button ?? {};
    this.emittendBttonCellClick.emit({
      ...button,
      name: button.name ?? button.event ?? 'buttonClick',
      eventName: button.event ?? button.name ?? 'buttonClick',
      rowData: row,
      data: row,
      rowIndex,
      col: column,
      originalEvent: event
    });
  }

  sort(column: ColData): void {
    if (!column.dataField || column.type === 'campoButton' || column.type === 'campoImg') return;
    if (this.sortField === column.dataField) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = column.dataField;
      this.sortDirection = 'asc';
    }
  }

  displayValue(row: any, column: ColData): string {
    const value = row?.[column.dataField];
    if (value === null || value === undefined || value === '') return '—';

    if (column.type === 'campoLista') {
      const options = column.lista?.options ?? [];
      const valueKey = column.lista?.valueExp || 'id';
      const displayKey = column.lista?.displayExp || 'value';
      const option = options.find((item: any) => item?.[valueKey] == value);
      return option?.[displayKey] ?? String(value);
    }

    if (column.type === 'campoDateTime' || column.type === 'campoData') {
      const date = this.toDate(value);
      if (!date) return String(value);
      return new Intl.DateTimeFormat('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: column.type === 'campoDateTime' ? '2-digit' : undefined,
        minute: column.type === 'campoDateTime' ? '2-digit' : undefined
      }).format(date);
    }

    if (column.type === 'campoNumber') {
      const number = Number(value);
      if (!Number.isFinite(number)) return String(value);
      const decimals = column.format?.includes('.') ? column.format.split('.')[1].length : 3;
      return new Intl.NumberFormat('it-IT', {
        maximumFractionDigits: decimals
      }).format(number);
    }

    if (typeof value === 'boolean') return value ? 'Sì' : 'No';
    return String(value);
  }

  private toDate(value: unknown): Date | null {
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    if (typeof value === 'object' && value !== null && 'seconds' in value) {
      const seconds = Number((value as { seconds: unknown }).seconds);
      if (Number.isFinite(seconds)) return new Date(seconds * 1000);
    }

    const date = new Date(value as string | number);
    return Number.isNaN(date.getTime()) ? null : date;
  }
}
