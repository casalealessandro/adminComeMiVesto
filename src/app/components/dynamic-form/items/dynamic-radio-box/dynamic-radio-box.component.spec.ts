import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { FormService } from '../../../../services/form.service';
import { DynamicRadioBoxComponent } from './dynamic-radio-box.component';

describe('DynamicRadioBoxComponent', () => {
  let component: DynamicRadioBoxComponent;
  let fixture: ComponentFixture<DynamicRadioBoxComponent>;
  let service: jasmine.SpyObj<FormService>;
  const options = [{ id: 'N', name: 'North', parent: 'north' }, { id: 'S', name: 'South', parent: 'south' }];

  beforeEach(async () => {
    service = jasmine.createSpyObj<FormService>('FormService', ['getData']);
    await TestBed.configureTestingModule({ imports: [DynamicRadioBoxComponent], providers: [{ provide: FormService, useValue: service }] }).compileComponents();
    fixture = TestBed.createComponent(DynamicRadioBoxComponent);
    component = fixture.componentInstance;
    component.formGroup = new FormGroup({ choice: new FormControl(null) });
  });

  function configure(overrides: any = {}) {
    component.config = { name: 'choice', type: 'radio', typeInput: 'radio', label: 'Choice',
      radioOptions: { displayExp: 'name', valueExp: 'id', options, remote: false, parent: null, ...overrides } };
  }

  it('initializes static options and configured expressions without a separate edit value', async () => {
    configure(); component.formGroup.get('choice')?.setValue('S'); component.value = 'ignored'; await component.initializeOptions();
    expect(component.availableOptions).toBe(options); expect(component.isLoading).toBeFalse();
    expect(component.displayExp).toBe('name'); expect(component.valueExp).toBe('id');
    expect(component.selectedValue).toBe('S'); expect(component.formGroup.get('choice')?.value).toBe('S');
  });

  it('uses expression fallbacks and an empty static options array', async () => {
    configure({ displayExp: '', valueExp: '', options: undefined }); await component.initializeOptions();
    expect(component.displayExp).toBe('value'); expect(component.valueExp).toBe('id'); expect(component.availableOptions).toEqual([]);
  });

  it('emits the selected value with radio metadata and parent context', async () => {
    configure({ parent: 'region' }); await component.initializeOptions(); const emit = spyOn(component.valueChange, 'emit');
    const event = { target: { value: 'S' } }; component.onValueChange(event);
    expect(emit).toHaveBeenCalledWith({ event, selectedValue: 'S', component, radioOptions: component.radioOptions, parentField: 'region' });
  });

  it('disables while loading remote options and enables after data arrives', async () => {
    let resolve!: (value: any[]) => void; service.getData.and.returnValue(new Promise(r => resolve = r)); configure({ remote: true, api: 'roles' });
    const pending = component.initializeOptions(); expect(component.isLoading).toBeTrue(); expect(component.formGroup.get('choice')?.disabled).toBeTrue();
    expect(service.getData).toHaveBeenCalledWith('roles', undefined); resolve(options); await pending;
    expect(component.availableOptions).toEqual(options); expect(component.isLoading).toBeFalse(); expect(component.formGroup.get('choice')?.enabled).toBeTrue();
  });

  it('recovers from an empty remote response', async () => {
    service.getData.and.resolveTo([]); configure({ remote: true, api: 'roles' }); await component.initializeOptions();
    expect(component.availableOptions).toEqual([]); expect(component.isLoading).toBeFalse(); expect(component.formGroup.get('choice')?.enabled).toBeTrue();
  });

  it('silently recovers from a remote error', async () => {
    service.getData.and.rejectWith(new Error('offline')); configure({ remote: true, api: 'roles' }); await component.initializeOptions();
    expect(component.availableOptions).toEqual([]); expect(component.isLoading).toBeFalse(); expect(component.formGroup.get('choice')?.enabled).toBeTrue();
  });

  it('filters static options by the initial parent and reacts to changes', async () => {
    configure({ parent: 'region' }); fixture.componentRef.setInput('parentValue', 'north'); fixture.detectChanges(); await component.initializeOptions();
    expect(component.availableOptions).toEqual([options[0]]);
    fixture.componentRef.setInput('parentValue', 'south'); fixture.detectChanges(); await fixture.whenStable();
    expect(component.availableOptions).toEqual([options[1]]);
  });

  [0, false].forEach(parent => it(`preserves the explicit falsy parent ${parent}`, async () => {
    const falsyOptions = [{ id: 1, parent: 0 }, { id: 2, parent: false }]; configure({ parent: 'region', options: falsyOptions });
    fixture.componentRef.setInput('parentValue', parent); fixture.detectChanges(); await component.initializeOptions();
    expect(component.availableOptions).toEqual(falsyOptions.filter(option => option.parent === parent));
  }));

  it('uses the slash-prefixed parent contract and reloads remote options reactively', async () => {
    service.getData.and.resolveTo(options); configure({ remote: true, api: 'cities', parent: 'region' });
    fixture.componentRef.setInput('parentValue', 'IT'); fixture.detectChanges(); await component.initializeOptions();
    expect(service.getData).toHaveBeenCalledWith('cities', '/IT');
    fixture.componentRef.setInput('parentValue', 'FR'); fixture.detectChanges(); await fixture.whenStable();
    expect(service.getData).toHaveBeenCalledWith('cities', '/FR');
  });
});
