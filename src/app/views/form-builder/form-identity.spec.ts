import { buildFormPayload } from './form-builder.component';
import { parseFields } from '../../services/form.service';
describe('form identity', () => {
  it('keeps technical id separate from display name', () => {
    expect(buildFormPayload('123456', 'Outfit Admin', [])).toEqual({ id: '123456', nameForm: 'Outfit Admin', json: [] });
  });
  it('round-trips legacy metadata through builder payload and service reload parsing', () => {
    const legacy: any[] = [{ name: 'title', type: 'textBox', typeInput: 'text', label: 'Title', minlength: 2, maxlength: 20,
      fileBoxOptions: { maxWidth: 600, maxheight: 800, isbase64: false, maxSize: 3 } }];
    const payload = buildFormPayload('id-1', ' Form ', legacy);
    const reloaded = parseFields(JSON.stringify(payload.json));
    expect(reloaded[0]).toEqual(jasmine.objectContaining({ minLength: 2, maxLength: 20 }));
    expect(reloaded[0].fileBoxOptions).toEqual({ maxWidth: 600, maxHeight: 800, maxSize: 3 });
    expect(JSON.stringify(payload.json)).not.toMatch(/isBase64|isbase64/);
    expect(JSON.stringify(reloaded)).not.toMatch(/minlength|maxlength|maxheight|isBase64|isbase64/);
  });
});
