import { StoredForm } from '../../services/form.service';
import {
  OCCASION_FORM, hasOccasionImageFileBox,
  isOccasionFormReady, missingOccasionFormFields, occasionFormDefinition,
} from './occasion-form-definitions';

describe('Single Firestore occasion form for create and edit', () => {
  it('uses one document with the entire schema, including id and image', () => {
    expect(occasionFormDefinition.id).toBe(OCCASION_FORM);
    expect(occasionFormDefinition.json.map(field => field.name))
      .toEqual(['id', 'value', 'order', 'active', 'image']);
    const image = occasionFormDefinition.json.find(field => field.name === 'image');
    expect(image?.type).toBe('fileBox');
    expect(image?.fileBoxOptions).toEqual({ maxWidth: 512, maxHeight: 512, maxSize: 4 });
    expect(image?.required).toBeFalse();
    expect(occasionFormDefinition.json.find(field => field.name === 'id')?.required).toBeTrue();
  });

  it('initializes the single form only if absent', () => {
    expect(missingOccasionFormFields(undefined)).toEqual(occasionFormDefinition.json);
    expect(isOccasionFormReady([])).toBeFalse();
    expect(isOccasionFormReady([occasionFormDefinition])).toBeTrue();
  });

  it('only adds missing image, retaining custom labels and order', () => {
    const customized: StoredForm = {
      id: OCCASION_FORM,
      nameForm: 'Mio form',
      json: occasionFormDefinition.json.filter(field => field.name !== 'image')
        .map(field => field.name === 'value' ? { ...field, label: 'Il mio titolo' } : field),
    };
    expect(missingOccasionFormFields(customized).map(field => field.name)).toEqual(['image']);
    expect(customized.json.find(field => field.name === 'value')?.label).toBe('Il mio titolo');
  });

  it('repeated setup never adds a duplicate field', () => {
    expect(missingOccasionFormFields(occasionFormDefinition)).toEqual([]);
  });

  it('rejects a text field named image rather than a real FileBox', () => {
    const invalid: StoredForm = { ...occasionFormDefinition,
      json: occasionFormDefinition.json.map(field =>
        field.name === 'image' ? { ...field, type: 'textBox' } : field),
    };
    expect(hasOccasionImageFileBox(invalid)).toBeFalse();
    expect(isOccasionFormReady([invalid])).toBeFalse();
  });
});
