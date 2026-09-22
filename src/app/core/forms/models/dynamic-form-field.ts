export interface DynamicFormFieldLayout {
  /** Stable, technical identifier used by the builder to group consecutive fields. */
  rowId?: string;
  /** Explicit width on the twelve-column layout grid. Absence means AUTO. */
  colSpan?: number;
}

export interface DynamicFormField {
  htmlId?: string;
  name: string;
  type: 'textBox' | 'textArea' | 'selectBox' | 'fileBox' | 'checkBox' | 'hiddenBox' | 'radio';
  typeInput: string;
  label: string;
  cssClass?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  placeholder?: string;
  options?: any[];
  selectOptions?: SelectOptions;
  radioOptions?: RadioOptions;
  checkBoxOptions?: CheckBoxOptions;
  fileBoxOptions?: FileBoxOptions;
  funcButton?: boolean;
  layout?: DynamicFormFieldLayout;
}

export interface SelectOptions {
  displayExp: string;
  valueExp: string;
  options?: any[];
  multiple: boolean;
  remote: boolean;
  api?: string;
  parent: string | null;
}

export interface RadioOptions {
  displayExp: string;
  valueExp: string;
  options?: any[];
  remote: boolean;
  api?: string;
  parent: string | null;
}

export interface FileBoxOptions {
  maxWidth: number;
  maxHeight: number;
  maxSize?: number;
}

export interface CheckBoxOptions {
  haveLink: boolean;
  hrefLink: string;
  hrefText: string;
}

type LegacyDynamicFormField = Omit<DynamicFormField, 'fileBoxOptions'> & {
  minlength?: number;
  maxlength?: number;
  fileBoxOptions?: FileBoxOptions & {
    maxheight?: number;
    isBase64?: boolean;
    isbase64?: boolean;
  };
};

/** Converts saved legacy field names to the canonical camelCase contract. */
export function normalizeDynamicFormField(field: LegacyDynamicFormField): DynamicFormField {
  const { minlength, maxlength, fileBoxOptions, layout, ...canonicalField } = field;
  const normalized: DynamicFormField = {
    ...canonicalField,
    minLength: field.minLength ?? minlength,
    maxLength: field.maxLength ?? maxlength
  };

  if (layout && typeof layout === 'object') {
    const normalizedLayout: DynamicFormFieldLayout = {};
    if (typeof layout.rowId === 'string' && layout.rowId.trim()) {
      normalizedLayout.rowId = layout.rowId;
    }
    if (field.type !== 'hiddenBox' && Number.isInteger(layout.colSpan) && layout.colSpan! >= 1 && layout.colSpan! <= 12) {
      normalizedLayout.colSpan = layout.colSpan;
    }
    if (Object.keys(normalizedLayout).length) {
      normalized.layout = normalizedLayout;
    }
  }

  if (fileBoxOptions) {
    const { maxheight, isBase64, isbase64, ...canonicalFileBoxOptions } = fileBoxOptions;
    normalized.fileBoxOptions = {
      ...canonicalFileBoxOptions,
      maxHeight: fileBoxOptions.maxHeight ?? maxheight ?? 0
    };
  }

  return normalized;
}

export function normalizeDynamicFormFields(fields: LegacyDynamicFormField[]): DynamicFormField[] {
  return fields.map(normalizeDynamicFormField);
}
