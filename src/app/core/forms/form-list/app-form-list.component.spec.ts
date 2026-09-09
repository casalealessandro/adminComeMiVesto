import { formEditorRoute } from './app-form-list.component';
describe('AppFormListComponent identity', () => {
  it('navigates using backend id, not nameForm', () => {
    expect(formEditorRoute({ id: '123456' })).toEqual(['/form-builder', '123456']);
  });
});
