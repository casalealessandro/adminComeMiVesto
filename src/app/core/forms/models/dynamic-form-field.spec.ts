import { normalizeDynamicFormField, normalizeDynamicFormFields } from './dynamic-form-field';

const base = { name: 'photo', type: 'fileBox' as const, typeInput: 'file', label: 'Photo' };

describe('DynamicFormField metadata normalization', () => {
  it('preserves canonical validation and file metadata', () => {
    const source: any = { ...base, minLength: 2, maxLength: 20, min: 1, max: 9,
      fileBoxOptions: { maxWidth: 600, maxHeight: 800, isBase64: false, maxSize: 4 } };
    expect(normalizeDynamicFormField(source).fileBoxOptions).toEqual({ maxWidth: 600, maxHeight: 800, maxSize: 4 });
  });

  it('normalizes the known legacy property names and retains unrelated properties', () => {
    const field = normalizeDynamicFormField({ ...base, minlength: 3, maxlength: 20, custom: 'retained',
      fileBoxOptions: { maxWidth: 600, maxheight: 800, isbase64: false, maxSize: 7, customFile: true } } as any) as any;
    expect(field.minLength).toBe(3);
    expect(field.maxLength).toBe(20);
    expect(field.fileBoxOptions).toEqual({ maxWidth: 600, maxHeight: 800, maxSize: 7, customFile: true });
    expect(field.custom).toBe('retained');
    expect(JSON.stringify(field)).not.toMatch(/minlength|maxlength|maxheight|isBase64|isbase64/);
  });

  it('gives canonical values precedence over legacy values and strips both Base64 spellings', () => {
    const field = normalizeDynamicFormField({ ...base, minLength: 0, minlength: 3, maxLength: 0, maxlength: 20,
      fileBoxOptions: { maxWidth: 0, maxHeight: 0, maxheight: 800, isBase64: false, isbase64: true } } as any);
    expect(field.minLength).toBe(0);
    expect(field.maxLength).toBe(0);
    expect(field.fileBoxOptions?.maxHeight).toBe(0);
    expect(JSON.stringify(field)).not.toMatch(/isBase64|isbase64/);
  });

  it('normalizes every field in an array', () => {
    expect(normalizeDynamicFormFields([{ ...base, minlength: 1 } as any, { ...base, name: 'second', maxlength: 5 } as any]))
      .toEqual([jasmine.objectContaining({ minLength: 1 }), jasmine.objectContaining({ name: 'second', maxLength: 5 })]);
  });

  it('preserves canonical radio metadata through normalize and serialization', () => {
    const radioOptions = { displayExp: 'value', valueExp: 'id', options: [{ id: 'U', value: 'Uomo' }], remote: false, api: '', parent: '' };
    const normalized = normalizeDynamicFormField({ name: 'gender', type: 'radio', typeInput: 'radio', label: 'Gender', radioOptions });
    const serialized = JSON.parse(JSON.stringify(normalized));
    expect(serialized.type).toBe('radio');
    expect(serialized.radioOptions).toEqual(radioOptions);
    expect(serialized.selectOptions).toBeUndefined();
  });
});
