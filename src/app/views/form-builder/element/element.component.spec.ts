import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { ElementComponent } from './element.component';

describe('ElementComponent characterization', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [ElementComponent] }));
  function create(type: any, extra: any = {}) {
    const fixture = TestBed.createComponent(ElementComponent); const component = fixture.componentInstance;
    component.formField = { name: 'field', type, typeInput: 'text', label: 'Field', ...extra }; component.ngOnInit(); return component;
  }
  it('configures hiddenBox state and hidden input type', () => {
    const component = create('hiddenBox'); expect(component.showHiddenBox).toBeTrue(); expect(component.formField.typeInput).toBe('hidden');
  });
  it('applies checkbox defaults', () => {
    const component = create('checkBox'); expect(component.showCheckBoxOption).toBeTrue(); expect(component.formField.typeInput).toBe('boolean');
    expect(component.formField.checkBoxOptions).toEqual({ haveLink: false, hrefLink: '', hrefText: '' });
  });
  it('preserves existing checkbox metadata', () => {
    const value = { haveLink: true, hrefLink: '/terms', hrefText: 'Terms' }; expect(create('checkBox', { checkBoxOptions: value }).checkBoxOptions).toEqual(value);
  });
  it('applies file defaults and preserves existing file metadata', () => {
    expect(create('fileBox').fileBoxOptions).toEqual({ maxWidth: 0, maxHeight: 0, isBase64: true, maxSize: 10 });
    const value = { maxWidth: 600, maxHeight: 800, isBase64: false, maxSize: 2 };
    const existing = create('fileBox', { fileBoxOptions: value }); expect(existing.fileBoxOptions).toEqual(value); expect(existing.formField.typeInput).toBe('file');
  });
  it('applies select defaults and preserves existing metadata', () => {
    expect(create('selectBox').selectOptions).toEqual({ multiple: false, displayExp: '', valueExp: '', options: [], parent: '', remote: false, api: '' });
    const value = { multiple: true, displayExp: 'title', valueExp: 'id', options: [{ id: 1 }], parent: 'region', remote: true, api: 'cities' };
    const existing = create('selectBox', { selectOptions: value }); expect(existing.selectOptions).toEqual(value); expect(existing.formField.typeInput).toBe('selectBox');
  });
  it('adds, edits, selects and removes local options', () => {
    const component = create('selectBox', { selectOptions: { multiple: false, displayExp: 'text', valueExp: 'id', options: [], parent: '', remote: false, api: '' } });
    component.newOption = { id: 1, text: 'One' }; component.addOption(); expect(component.selectOptions.options).toEqual([{ id: 1, text: 'One' }]);
    component.onOptionClick(component.selectOptions.options![0]); expect(component.optionSelIndex).toBe(0);
    component.newOption = { id: 1, text: 'Updated' }; component.addOption(); expect(component.selectOptions.options![0].text).toBe('Updated');
    component.removeOption(0); expect(component.selectOptions.options).toEqual([]);
  });
  it('does not add remote or incomplete local options', () => {
    const remote = create('selectBox', { selectOptions: { multiple: false, displayExp: 'text', valueExp: 'id', options: [], parent: '', remote: true, api: 'x' } });
    remote.newOption = { id: 1, text: 'One' }; remote.addOption(); expect(remote.selectOptions.options).toEqual([]);
    const local = create('selectBox', { selectOptions: { multiple: false, displayExp: 'text', valueExp: 'id', options: [], parent: '', remote: false, api: '' } });
    local.newOption = { id: 1 }; local.addOption(); expect(local.selectOptions.options).toEqual([]);
  });
  it('rejects an invalid NgForm and marks its controls touched', () => {
    const component = create('textBox'); const control = new FormControl(''); const form: any = { valid: false, controls: { x: control }, control: new FormGroup({ x: control }) };
    expect(component.formPrsValidate(form)).toBeFalse(); expect(control.touched).toBeTrue();
  });
  it('rejects a local select without options, accepts remote without options, and accepts a valid form', () => {
    const valid: any = { valid: true };
    const local = create('selectBox'); expect(local.formPrsValidate(valid)).toBeFalse();
    const remote = create('selectBox', { selectOptions: { multiple: false, displayExp: '', valueExp: '', options: [], parent: '', remote: true, api: 'x' } });
    expect(remote.formPrsValidate(valid)).toBeTrue(); expect(create('textBox').formPrsValidate(valid)).toBeTrue();
  });
});
