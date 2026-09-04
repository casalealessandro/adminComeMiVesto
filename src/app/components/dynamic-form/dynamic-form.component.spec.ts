import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DynamicFormComponent } from './dynamic-form.component';
import { FormService } from '../../services/form.service';

describe('DynamicFormComponent', () => {
  let component: DynamicFormComponent;
  let fixture: ComponentFixture<DynamicFormComponent>;
  const fields = [
    { name: 'email', type: 'textBox' as const, typeInput: 'email', label: 'Email', required: true },
    { name: 'role', type: 'selectBox' as const, typeInput: 'selectBox', label: 'Ruolo', required: true,
      selectOptions: { multiple: false, displayExp: 'value', valueExp: 'id', options: [
        { id: 'creator', value: 'Creator' }, { id: 'editor', value: 'Editor' }, { id: 'admin', value: 'Admin' }
      ], parent: null, remote: false } }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DynamicFormComponent],
      providers: [{ provide: FormService, useValue: { getFormFields: jasmine.createSpy().and.returnValue(of(fields)) } }]
    }).compileComponents();
    fixture = TestBed.createComponent(DynamicFormComponent);
    component = fixture.componentInstance;
    component.service = 'adminUserCreateForm';
    fixture.detectChanges();
  });

  it('loads the configuration and validates email and role', () => {
    expect(component.fields).toEqual(fields);
    component.form.patchValue({ email: 'not-an-email', role: 'creator' });
    expect(component.form.invalid).toBeTrue();
    component.form.patchValue({ email: 'creator@example.com' });
    expect(component.form.valid).toBeTrue();
  });

  it('emits cancel and a valid submit using the established event contract', () => {
    const events: any[] = [];
    component.submitFormEvent.subscribe(event => events.push(event));
    component.cancellForm();
    component.form.patchValue({ email: 'editor@example.com', role: 'editor' });
    component.submitForm();
    expect(events.map(event => event.name)).toEqual(['cancelForm', 'submitForm']);
    expect(events[1].formData.role).toBe('editor');
    expect(events[1].inEdit).toBeFalse();
  });

  it('prevents submit while loading', () => {
    const emit = spyOn(component.submitFormEvent, 'emit');
    component.form.patchValue({ email: 'admin@example.com', role: 'admin' });
    component.loading = true;
    component.submitForm();
    expect(emit).not.toHaveBeenCalled();
  });
});
