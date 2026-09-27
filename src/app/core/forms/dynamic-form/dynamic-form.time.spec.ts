import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { FORM_DEFINITION_REPOSITORY } from '../contracts/form-definition-repository';
import { DynamicFormComponent } from './dynamic-form.component';

describe('DynamicFormComponent time input', () => {
  it('renders Firestore metadata with typeInput time as a native time input', async () => {
    const repository = {
      getForms: () => of([]),
      getFormById: () => of({ id: 'notification-form', nameForm: 'Notifica', json: [] }),
      getFormFields: jasmine.createSpy('getFormFields').and.returnValue(of([
        {
          name: 'scheduleTime',
          type: 'textBox',
          typeInput: 'time',
          label: 'Orario invio',
          required: false,
        },
      ])),
      saveForm: async () => undefined,
      deleteForm: async () => undefined,
    };

    await TestBed.configureTestingModule({
      imports: [DynamicFormComponent],
      providers: [
        { provide: FORM_DEFINITION_REPOSITORY, useValue: repository },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(DynamicFormComponent);
    fixture.componentRef.setInput('service', 'notification-form');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(repository.getFormFields).toHaveBeenCalledOnceWith('notification-form');
    const input = fixture.nativeElement.querySelector('input[name="scheduleTime"]') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.type).toBe('time');
  });
});
