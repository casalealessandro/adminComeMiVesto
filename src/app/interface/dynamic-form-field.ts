export interface DynamicFormField {
  htmlId?: string;
  name: string;
  type: 'textBox' | 'textArea' | 'selectBox' | 'fileBox' | 'checkBox' | 'hiddenBox';
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
  checkBoxOptions?: CheckBoxOptions;
  fileBoxOptions?: FileBoxOptions;
  funcButton?: boolean;
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

export interface FileBoxOptions {
  maxWidth: number;
  maxHeight: number;
  isBase64: boolean;
  maxSize?: number;
}

export interface CheckBoxOptions {
  haveLink: boolean;
  hrefLink: string;
  hrefText: string;
}

type LegacyDynamicFormField = DynamicFormField & {
  minlength?: number;
  maxlength?: number;
  fileBoxOptions?: FileBoxOptions & {
    maxheight?: number;
    isbase64?: boolean;
  };
};

/** Converts saved legacy field names to the canonical camelCase contract. */
export function normalizeDynamicFormField(field: LegacyDynamicFormField): DynamicFormField {
  const { minlength, maxlength, fileBoxOptions, ...canonicalField } = field;
  const normalized: DynamicFormField = {
    ...canonicalField,
    minLength: field.minLength ?? minlength,
    maxLength: field.maxLength ?? maxlength
  };

  if (fileBoxOptions) {
    const { maxheight, isbase64, ...canonicalFileBoxOptions } = fileBoxOptions;
    normalized.fileBoxOptions = {
      ...canonicalFileBoxOptions,
      maxHeight: fileBoxOptions.maxHeight ?? maxheight ?? 0,
      isBase64: fileBoxOptions.isBase64 ?? isbase64 ?? true
    };
  }

  return normalized;
}

export function normalizeDynamicFormFields(fields: LegacyDynamicFormField[]): DynamicFormField[] {
  return fields.map(normalizeDynamicFormField);
}
