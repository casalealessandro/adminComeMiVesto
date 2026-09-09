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
    expect(create('fileBox').fileBoxOptions).toEqual({ maxWidth: 0, maxHeight: 0, maxSize: 10 });
    const value: any = { maxWidth: 600, maxHeight: 800, isBase64: false, maxSize: 2 };
    const existing = create('fileBox', { fileBoxOptions: value });
    expect(existing.fileBoxOptions).toEqual({ maxWidth: 600, maxHeight: 800, maxSize: 2 });
    expect(existing.formField.typeInput).toBe('file');
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
  it('preserves falsy values in local select options', () => {
    const component = create('selectBox', { selectOptions: { multiple: false, displayExp: 'text', valueExp: 'id', options: [], parent: '', remote: false, api: '' } });
    component.newOption = { id: 0, text: 'Zero' }; component.addOption();
    component.newOption = { id: false, text: 'False' }; component.addOption();
    expect(component.selectOptions.options).toEqual([{ id: 0, text: 'Zero' }, { id: false, text: 'False' }]);
  });
  it('does not add remote or incomplete local options', () => {
    const remote = create('selectBox', { selectOptions: { multiple: false, displayExp: 'text', valueExp: 'id', options: [], parent: '', remote: true, api: 'x' } });
    remote.newOption = { id: 1, text: 'One' }; remote.addOption(); expect(remote.selectOptions.options).toEqual([]);
    const local = create('selectBox', { selectOptions: { multiple: false, displayExp: 'text', valueExp: 'id', options: [], parent: '', remote: false, api: '' } });
    local.newOption = { id: 1 }; local.addOption(); expect(local.selectOptions.options).toEqual([]);
  });
  it('applies radio defaults and preserves existing radio metadata', () => {
    expect(create('radio').radioOptions).toEqual({ displayExp: '', valueExp: '', options: [], parent: '', remote: false, api: '' });
    const value = { displayExp: 'name', valueExp: 'id', options: [{ id: 'A', name: 'A' }], parent: 'group', remote: true, api: 'roles' };
    const existing = create('radio', { radioOptions: value });
    expect(existing.radioOptions).toEqual(value); expect(existing.formField.typeInput).toBe('radio');
  });
  it('adds, edits and removes static radio options', () => {
    const component = create('radio', { radioOptions: { displayExp: 'text', valueExp: 'id', options: [], parent: '', remote: false, api: '' } });
    component.newRadioOption = { id: 'A', text: 'Alpha' }; component.addRadioOption(); expect(component.radioOptions.options).toEqual([{ id: 'A', text: 'Alpha' }]);
    component.onRadioOptionClick(component.radioOptions.options![0]); component.newRadioOption = { id: 'A', text: 'Updated' }; component.addRadioOption();
    expect(component.radioOptions.options![0].text).toBe('Updated'); component.removeRadioOption(0); expect(component.radioOptions.options).toEqual([]);
  });
  it('preserves falsy values in local radio options', () => {
    const component = create('radio', { radioOptions: { displayExp: 'text', valueExp: 'id', options: [], parent: '', remote: false, api: '' } });
    component.newRadioOption = { id: false, text: 'No' }; component.addRadioOption();
    component.newRadioOption = { id: 0, text: 'Zero' }; component.addRadioOption();
    expect(component.radioOptions.options).toEqual([{ id: false, text: 'No' }, { id: 0, text: 'Zero' }]);
  });
  it('blocks static options for remote radio and validates local versus remote configuration', () => {
    const local = create('radio'); const valid: any = { valid: true }; expect(local.formPrsValidate(valid)).toBeFalse();
    const remote = create('radio', { radioOptions: { displayExp: 'text', valueExp: 'id', options: [], parent: '', remote: true, api: 'roles' } });
    remote.newRadioOption = { id: 'A', text: 'Alpha' }; remote.addRadioOption(); expect(remote.radioOptions.options).toEqual([]);
    expect(remote.formPrsValidate(valid)).toBeTrue();
  });
  it('rejects remote select and radio without api', () => {
    const valid: any = { valid: true };
    const select = create('selectBox', { selectOptions: { multiple: false, displayExp: 'text', valueExp: 'id', options: [], parent: '', remote: true, api: '   ' } });
    const radio = create('radio', { radioOptions: { displayExp: 'text', valueExp: 'id', options: [], parent: '', remote: true, api: '' } });
    expect(select.formPrsValidate(valid)).toBeFalse();
    expect(radio.formPrsValidate(valid)).toBeFalse();
  });
  it('rejects select and radio configured as their own parent', () => {
    const valid: any = { valid: true };
    const select = create('selectBox', { selectOptions: { multiple: false, displayExp: 'text', valueExp: 'id', options: [{ id: 1, text: 'One' }], parent: 'field', remote: false, api: '' } });
    const radio = create('radio', { radioOptions: { displayExp: 'text', valueExp: 'id', options: [{ id: 1, text: 'One' }], parent: 'field', remote: false, api: '' } });
    expect(select.formPrsValidate(valid)).toBeFalse();
    expect(radio.formPrsValidate(valid)).toBeFalse();
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
