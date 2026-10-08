import { AffiliateProgram } from '../models/affiliate-catalog.models';
import { DynamicFormField } from '../../../core/forms/models/dynamic-form-field';
import { affiliateFeedRuntimeFields } from './affiliate-feed-runtime-form.repository';

describe('Affiliate feed persisted form runtime identities', () => {
  const fields: DynamicFormField[] = [
    { name: 'name', type: 'textBox', typeInput: 'text', label: 'Nome', required: true },
    { name: 'urlParams', type: 'textBox', typeInput: 'text', label: 'Parametri URL feed' },
  ];
  const programs = [{
    id: 'firestore-program-id', name: 'Pull&Bear', networkProgramId: '1234',
  }] as AffiliateProgram[];

  it('restores required identity fields and uses actual program IDs in create', () => {
    const result = affiliateFeedRuntimeFields(fields, programs, true);
    expect(result.map(field => field.name)).toEqual([
      'networkFeedId', 'affiliateProgramId', 'name', 'urlParams',
    ]);
    expect(result[0].required).toBeTrue();
    expect(result[1].required).toBeTrue();
    expect(result[1].type).toBe('selectBox');
    expect(result[1].selectOptions?.options).toEqual([
      { label: 'Pull&Bear · 1234', value: 'firestore-program-id' },
    ]);
  });

  it('keeps persisted fields on edit but strips immutable identities', () => {
    const withIdentity = [...fields, {
      name: 'affiliateProgramId', type: 'textBox', typeInput: 'text',
      label: 'Programma erroneamente configurato',
    } as DynamicFormField];
    const result = affiliateFeedRuntimeFields(withIdentity, programs, false);
    expect(result.map(field => field.name)).toEqual(['name', 'urlParams']);
  });

  it('does not change source Firestore fields or optional URL parameters', () => {
    const before = JSON.stringify(fields);
    const result = affiliateFeedRuntimeFields(fields, programs, true);
    expect(JSON.stringify(fields)).toBe(before);
    expect(result[3]).toEqual(fields[1]);
  });
});
