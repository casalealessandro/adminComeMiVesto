import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { buildFormPayload } from '../../views/form-builder/form-builder.component';
import { parseFields, FormService } from '../../services/form.service';
import { FORM_DEFINITION_REPOSITORY } from '../../services/form-definition-repository';
import { FORM_OPTIONS_PROVIDER } from '../../services/form-options-provider';
import { DynamicFormComponent } from './dynamic-form.component';
import { DynamicSelectBoxComponent } from './items/dynamic-select-box/dynamic-select-box.component';
import { DynamicRadioBoxComponent } from './items/dynamic-radio-box/dynamic-radio-box.component';
import { DynamicFormField } from '../../interface/dynamic-form-field';

describe('Forms Core v1 integration characterization', () => {
  let fixture: ComponentFixture<DynamicFormComponent>;
  let component: DynamicFormComponent;
  let service: jasmine.SpyObj<FormService>;

  beforeEach(async () => {
    service = jasmine.createSpyObj<FormService>('FormService', ['getFormFields', 'getData']);
    service.getData.and.resolveTo([]);
    await TestBed.configureTestingModule({
      imports: [DynamicFormComponent],
      providers: [
        { provide: FORM_DEFINITION_REPOSITORY, useValue: service },
        { provide: FORM_OPTIONS_PROVIDER, useValue: service }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(DynamicFormComponent);
    component = fixture.componentInstance;
  });

  it('round-trips canonical metadata from builder payload through reload parsing and DynamicForm submit', () => {
    const metadata: DynamicFormField[] = [
      { name: 'name', type: 'textBox', typeInput: 'text', label: 'Name', required: true },
      {
        name: 'size', type: 'selectBox', typeInput: 'selectBox', label: 'Size',
        selectOptions: {
          displayExp: 'label', valueExp: 'id', multiple: false, remote: false, parent: null,
          options: [{ id: 1, label: 'Small' }, { id: 2, label: 'Large' }]
        }
      },
      {
        name: 'enabled', type: 'radio', typeInput: 'radio', label: 'Enabled',
        radioOptions: {
          displayExp: 'label', valueExp: 'id', remote: false, parent: null,
          options: [{ id: true, label: 'Yes' }, { id: false, label: 'No' }]
        }
      },
      {
        name: 'avatar', type: 'fileBox', typeInput: 'file', label: 'Avatar',
        fileBoxOptions: { maxWidth: 600, maxHeight: 800, maxSize: 3 }
      }
    ];

    const payload = buildFormPayload('core-v1', ' Core V1 ', metadata);
    const reloaded = parseFields(JSON.stringify(payload.json));

    expect(payload.id).toBe('core-v1');
    expect(payload.nameForm).toBe('Core V1');
    expect(reloaded.map(field => field.type)).toEqual(['textBox', 'selectBox', 'radio', 'fileBox']);
    expect(reloaded[0]).toEqual(jasmine.objectContaining({ name: 'name', required: true }));
    expect(reloaded[1].selectOptions).toEqual(metadata[1].selectOptions);
    expect(reloaded[2].radioOptions).toEqual(metadata[2].radioOptions);
    expect(reloaded[3].fileBoxOptions).toEqual({ maxWidth: 600, maxHeight: 800, maxSize: 3 });

    service.getFormFields.and.returnValue(of(reloaded));
    component.service = 'core-v1';
    component.editData = { name: 'Ada', size: 2, enabled: false, avatar: 'image-ref' };
    const emit = spyOn(component.submitFormEvent, 'emit');

    component.ngOnInit();
    component.submitForm();

    expect(service.getFormFields).toHaveBeenCalledOnceWith('core-v1');
    expect(component.form.value).toEqual({ name: 'Ada', size: 2, enabled: false, avatar: 'image-ref' });
    expect(typeof component.form.value.size).toBe('number');
    expect(typeof component.form.value.enabled).toBe('boolean');
    expect(emit).toHaveBeenCalledWith({
      name: 'submitForm',
      formData: { name: 'Ada', size: 2, enabled: false, avatar: 'image-ref' },
      form: component.form,
      inEdit: true
    });
  });

  it('propagates an empty parent through a static radio -> select -> radio cascade', async () => {
    const fields: DynamicFormField[] = [
      {
        name: 'region', type: 'radio', typeInput: 'radio', label: 'Region',
        radioOptions: {
          displayExp: 'label', valueExp: 'id', remote: false, parent: null,
          options: [{ id: 'north', label: 'North' }, { id: 'south', label: 'South' }]
        }
      },
      {
        name: 'city', type: 'selectBox', typeInput: 'selectBox', label: 'City',
        selectOptions: {
          displayExp: 'label', valueExp: 'id', multiple: false, remote: false, parent: 'region',
          options: [{ id: 10, label: 'North City', parent: 'north' }, { id: 20, label: 'South City', parent: 'south' }]
        }
      },
      {
        name: 'district', type: 'radio', typeInput: 'radio', label: 'District',
        radioOptions: {
          displayExp: 'label', valueExp: 'id', remote: false, parent: 'city',
          options: [{ id: true, label: 'North District', parent: 10 }, { id: false, label: 'South District', parent: 20 }]
        }
      }
    ];

    service.getFormFields.and.returnValue(of(fields));
    component.service = 'cascade';
    component.editData = { region: 'north', city: 10, district: true };
    component.ngOnInit();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const select = fixture.debugElement
      .queryAll(By.directive(DynamicSelectBoxComponent))
      .map(debug => debug.componentInstance as DynamicSelectBoxComponent)
      .find(item => item.config.name === 'city')!;
    const district = fixture.debugElement
      .queryAll(By.directive(DynamicRadioBoxComponent))
      .map(debug => debug.componentInstance as DynamicRadioBoxComponent)
      .find(item => item.config.name === 'district')!;

    expect(select.availableOptions).toEqual([{ id: 10, label: 'North City', parent: 'north' }]);
    expect(district.availableOptions).toEqual([{ id: true, label: 'North District', parent: 10 }]);
    expect(component.form.value).toEqual({ region: 'north', city: 10, district: true });

    component.onValueChangeSelectBox('region', { selectedValue: '' });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(select.availableOptions).toEqual([]);
    expect(district.availableOptions).toEqual([]);
    expect(component.form.get('city')?.value).toBeNull();
    expect(component.form.get('district')?.value).toBeNull();
    expect(component.formValues.city).toBeNull();
    expect(component.formValues.district).toBeNull();
    expect(component.parentValues().region).toBe('');
    expect(component.parentValues().city).toBeNull();
  });
});
