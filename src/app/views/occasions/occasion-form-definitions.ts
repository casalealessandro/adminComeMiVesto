import { DynamicFormField } from '../../core/forms/models/dynamic-form-field';
import { StoredForm } from '../../services/form.service';

/**
 * Una sola definizione nella collection forms, riutilizzata per creazione e modifica.
 * Il controllo ID viene disabilitato nel componente soltanto durante la modifica.
 */
export const OCCASION_FORM = 'outfit-occasion';

export const occasionFormDefinition: StoredForm = {
  id: OCCASION_FORM,
  nameForm: 'Occasione outfit',
  json: [
    { name: 'id', label: 'Codice univoco (lettere, numeri, _ o -)', type: 'textBox', typeInput: 'text', required: true, maxLength: 64 },
    { name: 'value', label: 'Nome occasione', type: 'textBox', typeInput: 'text', required: true, maxLength: 100 },
    { name: 'order', label: 'Ordine', type: 'textBox', typeInput: 'number', required: true },
    { name: 'active', label: 'Attiva', type: 'selectBox', typeInput: 'text', required: true,
      selectOptions: { displayExp: 'label', valueExp: 'value', multiple: false, remote: false, parent: null,
        options: [{ label: 'Sì', value: true }, { label: 'No', value: false }] } },
    { name: 'image', label: 'Immagine occasione (unisex)', type: 'fileBox', typeInput: 'file',
      required: false, fileBoxOptions: { maxWidth: 512, maxHeight: 512, maxSize: 4 } },
  ],
};

/** Integra solo i campi mancanti, mantenendo configurazione e ordine personalizzati. */
export function missingOccasionFormFields(stored: StoredForm | undefined): DynamicFormField[] {
  if (!stored) return [...occasionFormDefinition.json];
  const known = new Set(stored.json.map(field => field.name));
  return occasionFormDefinition.json.filter(field => !known.has(field.name));
}

export function hasOccasionImageFileBox(form: StoredForm | undefined): boolean {
  return !!form?.json.some(field => field.name === 'image' && field.type === 'fileBox');
}

export function isOccasionFormReady(forms: StoredForm[]): boolean {
  const stored = forms.find(form => form.id === OCCASION_FORM);
  return !!stored && hasOccasionImageFileBox(stored) &&
    occasionFormDefinition.json.every(field => stored.json.some(existing => existing.name === field.name));
}
