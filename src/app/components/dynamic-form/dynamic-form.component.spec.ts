import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { FormGroup } from '@angular/forms';
import { DynamicFormComponent } from './dynamic-form.component';
import { FormService } from '../../services/form.service';
import { DynamicFormField } from '../../interface/dynamic-form-field';

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
    await TestBed.configureTestingModule({ imports: [DynamicFormComponent], providers: [{ provide: FormService, useValue: service }] }).compileComponents();
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
  it('characterizes false, zero, empty string and null edit values as null controls while retaining formValues', () => {
    component.fields = fields;
    component.editData = { required: false, length: 0, email: '', number: null };
    component.initializeForm();
    expect(component.form.value).toEqual({ required: null, length: null, email: null, number: null, plain: null });
    expect(component.formValues).toEqual(jasmine.objectContaining({ required: false, length: 0, email: '', number: null }));
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
