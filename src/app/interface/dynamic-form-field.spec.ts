import { normalizeDynamicFormField } from './dynamic-form-field';

describe('normalizeDynamicFormField', () => {
  it('normalizes legacy property names and removes them from saved JSON', () => {
    const field = normalizeDynamicFormField({
      name: 'description',
      type: 'textBox',
      typeInput: 'text',
      label: 'Description',
      minlength: 3,
      maxlength: 20,
      fileBoxOptions: {
        maxWidth: 600,
        maxheight: 800,
        isbase64: false
      }
    } as any);

    expect(field.minLength).toBe(3);
    expect(field.maxLength).toBe(20);
    expect(field.fileBoxOptions?.maxHeight).toBe(800);
    expect(field.fileBoxOptions?.isBase64).toBeFalse();

    const savedJson = JSON.stringify(field);
    expect(savedJson).not.toContain('minlength');
    expect(savedJson).not.toContain('maxlength');
    expect(savedJson).not.toContain('maxheight');
    expect(savedJson).not.toContain('isbase64');
  });

  it('prefers canonical values when both formats are present', () => {
    const field = normalizeDynamicFormField({
      name: 'title',
      type: 'textBox',
      typeInput: 'text',
      label: 'Title',
      minLength: 4,
      minlength: 2,
      maxLength: 40,
      maxlength: 10
    } as any);

    expect(field.minLength).toBe(4);
    expect(field.maxLength).toBe(40);
  });
});
