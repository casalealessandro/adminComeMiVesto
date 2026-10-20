import { DynamicFormField } from '../../core/forms/models/dynamic-form-field';
import { StoredForm } from '../../services/form.service';

export const OCCASION_CREATE_FORM = 'outfit-occasion-create';
export const OCCASION_EDIT_FORM = 'outfit-occasion-edit';

const imageField: DynamicFormField = {
  name: 'image',
  label: 'Immagine occasione (unisex)',
  type: 'fileBox',
  typeInput: 'file',
  required: false,
  fileBoxOptions: { maxWidth: 512, maxHeight: 512, maxSize: 4 },
};

const baseFields: DynamicFormField[] = [
  { name: 'value', label: 'Nome occasione', type: 'textBox', typeInput: 'text', required: true, maxLength: 100 },
  { name: 'order', label: 'Ordine', type: 'textBox', typeInput: 'number', required: true },
  { name: 'active', label: 'Attiva', type: 'selectBox', typeInput: 'text', required: true,
    selectOptions: { displayExp: 'label', valueExp: 'value', multiple: false, remote: false, parent: null,
      options: [{ label: 'Sì', value: true }, { label: 'No', value: false }] } },
];

export const occasionFormDefinitions: readonly StoredForm[] = [
  {
    id: OCCASION_CREATE_FORM,
    nameForm: 'Nuova occasione',
    json: [
      { name: 'id', label: 'Codice univoco (lettere, numeri, _ o -)', type: 'textBox', typeInput: 'text', required: true, maxLength: 64 },
      ...baseFields,
      imageField,
    ],
  },
  { id: OCCASION_EDIT_FORM, nameForm: 'Modifica occasione', json: [...baseFields, imageField] },
];

/** Migrate only absent metadata. Existing Form Builder customizations are preserved. */
export function missingOccasionFormFields(stored: StoredForm | undefined, template: StoredForm): DynamicFormField[] {
  if (!stored) return [...template.json];
  const current = new Set(stored.json.map(field => field.name));
  return template.json.filter(field => !current.has(field.name));
}

export function hasOccasionImageFileBox(form: StoredForm | undefined): boolean {
  return !!form?.json.some(field => field.name === 'image' && field.type === 'fileBox');
}

export function isOccasionFormReady(forms: StoredForm[]): boolean {
  return occasionFormDefinitions.every(template => {
    const stored = forms.find(form => form.id === template.id);
    return !!stored && hasOccasionImageFileBox(stored) &&
      template.json.every(field => stored.json.some(existing => existing.name === field.name));
  });
}
