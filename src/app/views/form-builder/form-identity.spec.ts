import { buildFormPayload } from './form-builder.component';
describe('form identity', () => {
  it('keeps technical id separate from display name', () => {
    expect(buildFormPayload('123456', 'Outfit Admin', [])).toEqual({ id: '123456', nameForm: 'Outfit Admin', json: [] });
  });
});
