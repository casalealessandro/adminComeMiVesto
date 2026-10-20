import { StoredForm } from '../../services/form.service';
import {
  OCCASION_CREATE_FORM, OCCASION_EDIT_FORM, hasOccasionImageFileBox,
  isOccasionFormReady, missingOccasionFormFields, occasionFormDefinitions,
} from './occasion-form-definitions';

describe('Occasion forms persisted in Firestore', () => {
  it('defines distinct create/edit forms with image FileBox', () => {
    expect(occasionFormDefinitions.map(form => form.id))
      .toEqual([OCCASION_CREATE_FORM, OCCASION_EDIT_FORM]);
    for (const form of occasionFormDefinitions) {
      const image = form.json.find(field => field.name === 'image');
      expect(image?.type).toBe('fileBox');
      expect(image?.fileBoxOptions?.maxWidth).toBe(512);
      expect(image?.fileBoxOptions?.maxHeight).toBe(512);
      expect(image?.required).toBeFalse();
    }
    expect(occasionFormDefinitions[0].json.some(field => field.name === 'id')).toBeTrue();
    expect(occasionFormDefinitions[1].json.some(field => field.name === 'id')).toBeFalse();
  });

  it('initializes all fields only for missing forms', () => {
    const target = occasionFormDefinitions[0];
    expect(missingOccasionFormFields(undefined, target)).toEqual(target.json);
  });

  it('adds only missing image field, preserving customized names and order', () => {
    const target = occasionFormDefinitions[1];
    const customized: StoredForm = {
      id: target.id,
      nameForm: 'Mio form',
      json: target.json.filter(field => field.name !== 'image')
        .map(field => field.name === 'value' ? { ...field, label: 'Il mio titolo' } : field),
    };
    expect(missingOccasionFormFields(customized, target).map(field => field.name)).toEqual(['image']);
    expect(customized.json.find(field => field.name === 'value')?.label).toBe('Il mio titolo');
  });

  it('does not duplicate the field on repeated setup', () => {
    const target = occasionFormDefinitions[0];
    expect(missingOccasionFormFields(target, target)).toEqual([]);
  });

  it('requires real FileBox fields, not a textBox named image', () => {
    const configured = occasionFormDefinitions.map(form => ({ ...form, json: [...form.json] }));
    expect(isOccasionFormReady(configured)).toBeTrue();
    const invalid = [{ ...configured[0], json: configured[0].json.map(field =>
      field.name === 'image' ? { ...field, type: 'textBox' as const } : field),
    }, configured[1]];
    expect(hasOccasionImageFileBox(invalid[0])).toBeFalse();
    expect(isOccasionFormReady(invalid)).toBeFalse();
  });
});
