import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { FormGroup } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { DynamicFormComponent } from './dynamic-form.component';
import { FormService } from '../../services/form.service';
import { FORM_DEFINITION_REPOSITORY } from '../../services/form-definition-repository';
import { DynamicFormField } from '../../interface/dynamic-form-field';
import { CustomScrollbarComponent } from '../custom-scrollbar/custom-scrollbar.component';

describe('DynamicFormComponent characterization', () => {
  let component: DynamicFormComponent;
  let fixture: ComponentFixture<DynamicFormComponent>;
  let service: jasmine.SpyObj<FormService>;
  const fields: DynamicFormField[] = [
    { name: 'required', type: 'textBox', typeInput: 'text', label: 'Required label', required: true },
    { name: 'length', type: 'textBox', typeInput: 'text', label: 'Length', minLength: 2, maxLength: 4 },
    { name: 'email', type: 'textBox', typeInput: 'email', label: 'Email' },
    { name: 'number', type: 'textBox', typeInput: 'number', label: 'Number', min: 2, max: 5 },
    { name: 'plain', type: 'textBox', typeInput: 'text', label: 'Plain' }
  ];

  beforeEach(async () => {
    service = jasmine.createSpyObj<FormService>('FormService', ['getFormFields']);
    service.getFormFields.and.returnValue(of(fields));
    await TestBed.configureTestingModule({ imports: [DynamicFormComponent], providers: [{ provide: FORM_DEFINITION_REPOSITORY, useValue: service }] }).compileComponents();
    fixture = TestBed.createComponent(DynamicFormComponent);
    component = fixture.componentInstance;
  });

  it('does nothing when service is absent', () => {
    component.ngOnInit();
    expect(service.getFormFields).not.toHaveBeenCalled();
    expect(component.form.controls).toEqual({});
    expect(component.inEdit).toBeTrue();
  });
  it('loads metadata and initializes insert mode controls', () => {
    component.service = 'profile'; component.ngOnInit();
    expect(service.getFormFields).toHaveBeenCalledOnceWith('profile');
    expect(Object.keys(component.form.controls)).toEqual(fields.map(field => field.name));
    expect(component.editData).toEqual({}); expect(component.inEdit).toBeFalse();
  });
  it('reports a load error without creating controls', () => {
    service.getFormFields.and.returnValue(throwError(() => new Error('offline')));
    const toast = spyOn(component, 'presentToast'); component.service = 'profile'; component.ngOnInit();
    expect(toast).toHaveBeenCalledWith('Impossibile caricare la configurazione del form.');
    expect(component.form.controls).toEqual({});
  });
  it('loads edit values and retains edit mode', () => {
    component.service = 'profile'; component.editData = { required: 'saved', number: 4 }; component.ngOnInit();
    expect(component.form.value.required).toBe('saved'); expect(component.form.value.number).toBe(4); expect(component.inEdit).toBeTrue();
  });
  it('gives legacy idData precedence over editData', () => {
    component.service = 'profile'; component.editData = { required: 'edit' }; component.idData = { required: 'legacy' }; component.ngOnInit();
    expect(component.form.value.required).toBe('legacy');
  });
  it('preserves explicit falsy edit values in controls while retaining formValues', () => {
    component.fields = [
      { name: 'falseValue', type: 'textBox', typeInput: 'text', label: 'False' },
      { name: 'zeroValue', type: 'textBox', typeInput: 'number', label: 'Zero' },
      { name: 'emptyValue', type: 'textBox', typeInput: 'text', label: 'Empty' },
      { name: 'nullValue', type: 'textBox', typeInput: 'text', label: 'Null' },
      { name: 'missingValue', type: 'textBox', typeInput: 'text', label: 'Missing' }
    ];
    component.editData = { falseValue: false, zeroValue: 0, emptyValue: '', nullValue: null };
    component.initializeForm();
    expect(component.form.value).toEqual({ falseValue: false, zeroValue: 0, emptyValue: '', nullValue: null, missingValue: null });
    expect(component.form.get('falseValue')?.value).not.toBeNull();
    expect(component.form.get('zeroValue')?.value).not.toBeNull();
    expect(component.form.get('emptyValue')?.value).not.toBeNull();
    expect(component.formValues).toEqual(jasmine.objectContaining({ falseValue: false, zeroValue: 0, emptyValue: '', nullValue: null }));
  });
  it('preserves explicit falsy cascade parents and defaults null or absent parents', () => {
    component.fields = [
      { name: 'zeroChild', type: 'selectBox', typeInput: 'selectBox', label: 'Zero child', selectOptions: { displayExp: 'name', valueExp: 'id', multiple: false, remote: false, parent: 'zeroParent' } },
      { name: 'falseChild', type: 'selectBox', typeInput: 'selectBox', label: 'False child', selectOptions: { displayExp: 'name', valueExp: 'id', multiple: false, remote: false, parent: 'falseParent' } },
      { name: 'nullChild', type: 'selectBox', typeInput: 'selectBox', label: 'Null child', selectOptions: { displayExp: 'name', valueExp: 'id', multiple: false, remote: false, parent: 'nullParent' } },
      { name: 'absentChild', type: 'selectBox', typeInput: 'selectBox', label: 'Absent child', selectOptions: { displayExp: 'name', valueExp: 'id', multiple: false, remote: false, parent: 'absentParent' } }
    ];
    component.editData = { zeroParent: 0, falseParent: false, nullParent: null };
    component.initializeForm();
    expect(component.parentValues()).toEqual({ zeroParent: 0, falseParent: false, nullParent: '', absentParent: '' });
  });

  it('creates a radio control, restores its edit value, and applies required validation', () => {
    component.fields = [{ name: 'choice', type: 'radio', typeInput: 'radio', label: 'Choice', required: true,
      radioOptions: { displayExp: 'value', valueExp: 'id', options: [{ id: 'A', value: 'A' }], remote: false, parent: null } }];
    component.editData = { choice: 'A' }; component.initializeForm();
    expect(component.form.get('choice')?.value).toBe('A'); expect(component.form.get('choice')?.valid).toBeTrue();
    component.form.get('choice')?.setValue(null); expect(component.form.get('choice')?.hasError('required')).toBeTrue();
  });

  it('registers radio cascade parents while preserving falsy edit values', () => {
    component.fields = [{ name: 'child', type: 'radio', typeInput: 'radio', label: 'Child',
      radioOptions: { displayExp: 'value', valueExp: 'id', options: [], remote: false, parent: 'parentField' } }];
    component.editData = { parentField: false }; component.initializeForm();
    expect(component.parentValues()).toEqual({ parentField: false });
  });

  it('updates a registered parent when a radio-compatible value event is received', () => {
    component.fields = [{ name: 'child', type: 'radio', typeInput: 'radio', label: 'Child',
      radioOptions: { displayExp: 'value', valueExp: 'id', options: [], remote: false, parent: 'choice' } },
      { name: 'choice', type: 'radio', typeInput: 'radio', label: 'Choice', radioOptions: { displayExp: 'value', valueExp: 'id', options: [], remote: false, parent: null } }];
    component.editData = {}; component.initializeForm(); component.onValueChangeSelectBox('choice', { selectedValue: 'A' });
    expect(component.form.get('choice')?.value).toBe('A'); expect(component.parentValues().choice).toBe('A');
  });

  it('keeps formValues synchronized when Angular already updated the control', () => {
    component.fields = [{ name: 'choice', type: 'selectBox', typeInput: 'selectBox', label: 'Choice',
      selectOptions: { displayExp: 'value', valueExp: 'id', options: [], multiple: false, remote: false, parent: null } }];
    component.editData = { choice: 'old' }; component.initializeForm();
    component.form.get('choice')?.setValue('new'); component.onValueChange('choice', 'new');
    expect(component.formValues.choice).toBe('new');
    component.onValueChange('choice', null);
    expect(component.form.get('choice')?.value).toBeNull(); expect(component.formValues.choice).toBeNull();
  });

  it('renders the native dynamic radio component for radio metadata', () => {
    component.fields = [{ name: 'choice', type: 'radio', typeInput: 'radio', label: 'Choice',
      radioOptions: { displayExp: 'value', valueExp: 'id', options: [{ id: 'A', value: 'Alpha' }], remote: false, parent: null } }];
    component.editData = {}; component.initializeForm(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-dynamic-radio-box')).not.toBeNull();
  });

  it('keeps the form content inside the shared scroll primitive with the historical height contract', () => {
    component.fields = [];
    component.editData = {};
    component.initializeForm();
    fixture.detectChanges();

    const scrollbar = fixture.debugElement.query(By.directive(CustomScrollbarComponent))
      .componentInstance as CustomScrollbarComponent;

    expect(scrollbar.scrollHeigth).toBe(700);
  });

  it('applies required, length, email and number bounds and leaves plain fields unvalidated', () => {
    component.fields = fields; component.editData = {}; component.initializeForm();
    expect(component.form.get('required')?.hasError('required')).toBeTrue();
    component.form.patchValue({ required: 'yes', length: 'x', email: 'bad', number: 1 });
    expect(component.form.get('length')?.hasError('minlength')).toBeTrue(); expect(component.form.get('email')?.hasError('email')).toBeTrue();
    expect(component.form.get('number')?.hasError('min')).toBeTrue(); expect(component.form.get('plain')?.valid).toBeTrue();
    component.form.patchValue({ length: 'abcde', number: 6 });
    expect(component.form.get('length')?.hasError('maxlength')).toBeTrue(); expect(component.form.get('number')?.hasError('max')).toBeTrue();
    component.form.patchValue({ length: 'abc', email: 'a@b.it', number: 3 }); expect(component.form.valid).toBeTrue();
  });
  it('combines validators and reports invalid metadata labels', () => {
    component.fields = [{ name: 'technical', type: 'textBox', typeInput: 'email', label: 'Friendly label', required: true, minLength: 5 }];
    component.editData = {}; component.initializeForm();
    expect(component.form.get('technical')?.errors).toEqual(jasmine.objectContaining({ required: true }));
    expect(component.getInvalidFields(component.form)).toEqual(['Friendly label']);
  });
  it('marks every control touched, reports invalid fields, and does not emit an invalid submit', () => {
    component.fields = fields; component.editData = {}; component.initializeForm();
    const emit = spyOn(component.submitFormEvent, 'emit'); const invalid = spyOn(component, 'getInvalidFields').and.callThrough();
    const toast = spyOn(component, 'presentToast'); component.submitForm();
    expect(Object.values(component.form.controls).every(control => control.touched)).toBeTrue();
    expect(invalid).toHaveBeenCalledWith(component.form); expect(toast).toHaveBeenCalled(); expect(emit).not.toHaveBeenCalled();
  });
  it('emits the exact valid submit contract with the form reference', () => {
    component.fields = []; component.editData = {}; component.initializeForm(); component.inEdit = false;
    const emit = spyOn(component.submitFormEvent, 'emit'); component.submitForm();
    expect(emit).toHaveBeenCalledWith({ name: 'submitForm', formData: {}, form: component.form, inEdit: false });
  });
  it('emits the cancel contract with its component reference', () => {
    const emit = spyOn(component.submitFormEvent, 'emit'); component.cancellForm();
    expect(emit).toHaveBeenCalledWith({ name: 'cancelForm', formData: {}, form: component.form, component });
  });
  it('suppresses submit and cancel while loading', () => {
    const emit = spyOn(component.submitFormEvent, 'emit'); component.loading = true; component.submitForm(); component.cancellForm();
    expect(emit).not.toHaveBeenCalled();
  });
  it('preserves the functional-button payload', () => {
    const emit = spyOn(component.functionalInputFormEvent, 'emit'); const input = { name: 'lookup', value: 3 };
    component.onFucBtnClick(input); expect(emit).toHaveBeenCalledWith({ name: 'functionalInputClick', nomeCampo: 'lookup', allFields: input });
  });
  it('refresh resets all controls to null', () => {
    component.fields = [{ name: 'x', type: 'textBox', typeInput: 'text', label: 'X' }]; component.editData = { x: 'before' }; component.initializeForm();
    const original: FormGroup = component.form; component.refresh(); expect(component.form).toBe(original); expect(component.form.value).toEqual({ x: null });
  });
});