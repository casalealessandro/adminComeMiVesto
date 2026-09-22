import { DynamicFormField } from '../models/dynamic-form-field';
import {
  buildFormPayload,
  duplicateFormField,
  FormBuilderComponent,
  groupFormBuilderRows,
  isRowWidthValid
} from './form-builder.component';

const field = (name: string, rowId?: string, colSpan?: number, type: DynamicFormField['type'] = 'textBox'): DynamicFormField => ({
  name, type, typeInput: 'text', label: name,
  ...(rowId ? { layout: { rowId, ...(colSpan ? { colSpan } : {}) } } : {})
});

describe('FormBuilder row layout', () => {
  it('groups canonical consecutive row ids, separates different ids and preserves order', () => {
    const rows = groupFormBuilderRows([field('a', 'one'), field('b', 'one'), field('c', 'two')]);
    expect(rows.map(row => row.fields.map(item => item.name))).toEqual([['a', 'b'], ['c']]);
  });

  it('associates hiddenBox with its row without creating a space-consuming field', () => {
    const rows = groupFormBuilderRows([field('a', 'one'), field('secret', 'one', undefined, 'hiddenBox'), field('b', 'one')]);
    expect(rows.length).toBe(1);
    expect(rows[0].fields.map(item => item.name)).toEqual(['a', 'secret', 'b']);
    expect(rows[0].visibleFields.map(item => item.name)).toEqual(['a', 'b']);
    expect(rows[0].hiddenFields.map(item => item.name)).toEqual(['secret']);
  });

  it('validates custom widths and preserves residual space for AUTO fields', () => {
    expect(isRowWidthValid([field('a', 'r', 6), field('b', 'r', 5), field('c', 'r', 3)])).toBeFalse();
    expect(isRowWidthValid([field('a', 'r'), field('b', 'r'), field('c', 'r', 2)])).toBeTrue();
    expect(isRowWidthValid([field('a', 'r'), field('b', 'r', 12)])).toBeFalse();
    expect(isRowWidthValid([field('a', 'r', 12)])).toBeTrue();
    expect(isRowWidthValid([field('a', 'r', 12), field('secret', 'r', undefined, 'hiddenBox')])).toBeTrue();
  });

  it('duplicates the name and preserves rowId and colSpan', () => {
    const duplicated = duplicateFormField([field('active', 'row-abc', 2)], 0);
    expect(duplicated[1].name).toBe('active_copy');
    expect(duplicated[1].layout).toEqual({ rowId: 'row-abc', colSpan: 2 });
  });

  it('moves every field in a row together while preserving internal order', () => {
    const component = Object.create(FormBuilderComponent.prototype) as FormBuilderComponent;
    component.formElements = [
      field('a', 'one'), field('hidden1', 'one', undefined, 'hiddenBox'), field('b', 'one'),
      field('c', 'two'), field('hidden2', 'two', undefined, 'hiddenBox'), field('d', 'two')
    ];
    component.emptyRowIds = [];
    component.moveRow(1, -1);
    expect(component.formElements.map(item => item.name)).toEqual(['c', 'hidden2', 'd', 'a', 'hidden1', 'b']);
  });

  it('round-trips layout but does not enrich legacy payloads', () => {
    const configured = buildFormPayload('1', ' Form ', [field('a', 'row', 2)]);
    const legacy = buildFormPayload('2', ' Legacy ', [field('old')]);
    expect(configured.json[0].layout).toEqual({ rowId: 'row', colSpan: 2 });
    expect(legacy.json[0].layout).toBeUndefined();
  });

  it('tolerates a field without rowId without mutating it', () => {
    const source = field('unassigned');
    const rows = groupFormBuilderRows([source]);
    expect(rows.length).toBe(1);
    expect(rows[0].fields).toEqual([source]);
    expect(source.layout).toBeUndefined();
  });
});
