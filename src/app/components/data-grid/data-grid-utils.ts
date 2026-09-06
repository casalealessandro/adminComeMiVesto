import { ColData, Colonne } from '../../interface/app.interface';
import { GridFilterColumnMetadata } from './data-grid-filter-model';
import {
  GridFilter,
  GridFilterOperator,
  GridSearch,
  GridSort,
} from './data-grid-provider';

/**
 * Stateless utility layer for DataGrid behavior.
 *
 * These helpers must stay independent from Angular components, DOM state and
 * concrete backend transports. They receive all required state explicitly and
 * return values without mutating the DataGrid runtime.
 */
export class DataGridUtils {
  /**
   * Compares two values using the historical DataGrid ascending/descending
   * semantics. Equality always returns `0`.
   */
  static compareValues(valueA: any, valueB: any, direction: 'asc' | 'desc'): number {
    if (valueA < valueB) return direction === 'asc' ? -1 : 1;
    if (valueA > valueB) return direction === 'asc' ? 1 : -1;
    return 0;
  }

  /**
   * Normalizes the date formats historically accepted by the grid and returns
   * the requested English or Italian display format.
   *
   * Invalid or unsupported input returns an empty string.
   */
  static formatDate(dateString: string, type: 'EN' | 'it' = 'EN'): string {
    const regExpISO: RegExp = /(\d{4})([\/-])(\d{1,2})\2(\d{1,2})/;
    const regExpIT: RegExp = /(\d{1,2})([\/-])(\d{1,2})\2(\d{4})/;

    let isMatchISO = dateString.match(regExpISO);
    let isMatchIT = dateString.match(regExpIT);

    if (!isMatchISO && !isMatchIT) {
      return '';
    }

    if (isMatchIT) {
      if (dateString.includes('-'))
        dateString = `${dateString.split('-')[2]}-${dateString.split('-')[1]}-${dateString.split('-')[0]}`;
      else if (dateString.includes('/'))
        dateString = `${dateString.split('/')[2]}-${dateString.split('/')[1]}-${dateString.split('/')[0]}`;
    }

    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');

    let finallyData = '';
    if (type == 'EN') {
      finallyData = `${year}-${month}-${day}`;
    }

    if (type == 'it') {
      finallyData = `${day}-${month}-${year} `;
    }

    return finallyData;
  }

  /**
   * Evaluates one cell value against the historical local-search rules.
   *
   * Arrays and nullish values never match. Exact mode accepts strings, numbers
   * and booleans; non-exact mode supports string/number `contains` or
   * `startsWith` matching.
   */
  static matchesLocalSearch(
    value: any,
    searchText: string,
    exact: boolean = false,
    searchType: any = '',
  ): boolean {
    if (value === null || typeof value == 'undefined' || Array.isArray(value)) {
      return false;
    }

    if (exact) {
      if (typeof value != 'string' && typeof value != 'number' && typeof value != 'boolean') {
        return false;
      }

      return value.toString().toLowerCase() == searchText.toLowerCase();
    }

    if (typeof value != 'string' && typeof value != 'number') {
      return false;
    }

    const itemValue = value.toString().toLowerCase();
    const valueToSearch = searchText.toLowerCase();

    if (searchType == 'startsWith') {
      return itemValue.startsWith(valueToSearch);
    }

    return itemValue.includes(valueToSearch);
  }

  /**
   * Filters a local data source by applying `matchesLocalSearch` to one field.
   * The source array and row objects are not mutated.
   */
  static filterNonRemoteDataSource(
    array: any[],
    dataField: string | number,
    searchText: string,
    exact: boolean = false,
    searchType: any = '',
  ): any[] {
    return array.filter(item => {
      return DataGridUtils.matchesLocalSearch(item?.[dataField], searchText, exact, searchType);
    });
  }

  /**
   * Calculates the historical numeric footer summary for a configured column.
   * Columns without `dataField` or `showInSummary` return `0`.
   */
  static calculateColumnSummary(rows: any[], cols: ColData): number {
    if (!cols.dataField) {
      return 0;
    }

    if (!cols.showInSummary) {
      return 0;
    }

    const dataField = cols.dataField;
    return rows.reduce((acc, curr) => acc + curr[dataField], 0);
  }

  /**
   * Recovers the original column metadata from either a top-level column or a
   * historical grouped `Colonne.data` definition.
   */
  static getOriginalColumn(columns: Colonne[] | undefined, field: string): any {
    for (const group of columns ?? []) {
      if ((group as any)?.dataField === field) {
        return group;
      }

      const data = (group as any)?.data;
      if (!Array.isArray(data)) continue;

      const column = data.find((currentColumn: any) => currentColumn?.dataField === field);
      if (column) return column;
    }

    return undefined;
  }

  /**
   * Projects rendered header columns into provider-neutral global-search
   * metadata while preserving explicit historical search configuration.
   */
  static getProviderSearchColumns(
    colsHeader: ColData[],
    columns: Colonne[] | undefined,
  ): GridFilterColumnMetadata[] {
    return colsHeader
      .filter(column => !!column.dataField)
      .map(column => {
        const originalColumn = DataGridUtils.getOriginalColumn(columns, column.dataField);

        return {
          field: column.dataField,
          type: column.type,
          searchable: originalColumn?.search === false ? false : undefined,
          searchOperator: originalColumn?.searchOperator as GridFilterOperator | undefined,
        };
      });
  }

  /**
   * Builds provider-neutral metadata for one explicit column filter.
   * Returns `undefined` when the rendered column does not exist.
   */
  static getProviderFilterColumn(
    colsHeader: ColData[],
    columns: Colonne[] | undefined,
    field: string,
  ): GridFilterColumnMetadata | undefined {
    const column = colsHeader.find(currentColumn => currentColumn.dataField === field);
    if (!column) return undefined;

    const originalColumn = DataGridUtils.getOriginalColumn(columns, field);

    return {
      field,
      type: column.type,
      filterable: originalColumn?.allowFiltering === false ? false : undefined,
      filterOperator: originalColumn?.filterOperator as GridFilterOperator | undefined,
    };
  }

  /**
   * Restores the typed value represented by a historical static list filter.
   * Non-list columns and unresolved list metadata keep the raw input value.
   */
  static resolveProviderFilterInputValue(
    colsHeader: ColData[],
    columns: Colonne[] | undefined,
    field: string,
    value: string,
  ): unknown {
    if (value === '') return '';

    const column = colsHeader.find(currentColumn => currentColumn.dataField === field);
    if (column?.type !== 'campoLista') return value;

    const originalColumn = DataGridUtils.getOriginalColumn(columns, field);
    const listOptions = originalColumn?.lista ?? column.customizedOptions;
    const options = listOptions?.options;
    const valueExp = listOptions?.valueExp;

    if (!Array.isArray(options) || !valueExp) return value;

    const selectedOption = options.find((option: any) => String(option?.[valueExp]) === String(value));
    return selectedOption ? selectedOption[valueExp] : value;
  }

  /**
   * Clones global-search state, including independent condition objects, so a
   * provider request cannot mutate the engine snapshot by reference.
   */
  static cloneSearch(search?: GridSearch): GridSearch | undefined {
    if (!search) return undefined;

    return {
      value: search.value,
      conditions: search.conditions.map(condition => ({ ...condition })),
    };
  }

  /**
   * Clones provider filter objects without changing their values.
   */
  static cloneFilters(filters: GridFilter[]): GridFilter[] {
    return filters.map(filter => ({ ...filter }));
  }

  /**
   * Clones provider sort objects without changing their order.
   */
  static cloneSorts(sorts: GridSort[]): GridSort[] {
    return sorts.map(sort => ({ ...sort }));
  }

  /**
   * Creates the historical placeholder row used while continuation pages load.
   * The source row remains unchanged and every copied property is set to null.
   */
  static createMockItem<T>(item?: T): T | undefined {
    if (!item || typeof item !== 'object') return undefined;

    const mock = { ...(item as Record<string, unknown>) };
    Object.keys(mock).forEach(key => {
      mock[key] = null;
    });

    return mock as T;
  }
}
