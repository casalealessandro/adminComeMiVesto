import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { DynamicSelectBoxComponent } from './dynamic-select-box.component';
import { FormService } from '../../../../services/form.service';
import { FORM_OPTIONS_PROVIDER } from '../../../../services/form-options-provider';

describe('DynamicSelectBoxComponent characterization', () => {
  let component: DynamicSelectBoxComponent;
  let fixture: ComponentFixture<DynamicSelectBoxComponent>;
  let service: jasmine.SpyObj<FormService>;
  const options = [{ id: 1, title: 'One', parent: 'north' }, { id: 2, title: 'Two', parent: 'south' }];

  beforeEach(async () => {
    service = jasmine.createSpyObj<FormService>('FormService', ['getData']);
    await TestBed.configureTestingModule({ imports: [DynamicSelectBoxComponent], providers: [{ provide: FORM_OPTIONS_PROVIDER, useValue: service }] }).compileComponents();
    fixture = TestBed.createComponent(DynamicSelectBoxComponent); component = fixture.componentInstance;
    component.formGroup = new FormGroup({ choice: new FormControl() });
  });

  function configure(overrides: any = {}) {
    component.config = { name: 'choice', type: 'selectBox', typeInput: 'selectBox', label: 'Choice',
      selectOptions: { displayExp: 'title', valueExp: 'id', options, multiple: false, remote: false, parent: null, ...overrides } };
  }

  it('initializes local options, expressions, single selection and initial value', async () => {
    configure(); component.value = 2; await component.initializeOptions();
    expect(component.availableOptions).toBe(options); expect(component.displayExp).toBe('title'); expect(component.valueExp).toBe('id');
    expect(component.multiple).toBeFalse(); expect(component.selectedValue).toBe(2); expect(component.isLoading).toBeFalse();
  });
  it('initializes a multiple selection from values', async () => {
    configure({ multiple: true }); component.values = [1, 2]; component.value = 1; await component.initializeOptions();
    expect(component.multiple).toBeTrue(); expect(component.selectedValue).toEqual([1, 2]);
  });
  it('uses default display/value expressions and an empty local options array', async () => {
    configure({ displayExp: '', valueExp: '', options: undefined }); await component.initializeOptions();
    expect(component.displayExp).toBe('value'); expect(component.valueExp).toBe('id'); expect(component.availableOptions).toEqual([]);
  });
  it('loads remote options while disabling, then enables after a non-empty response', async () => {
    let resolve!: (value: any[]) => void; service.getData.and.returnValue(new Promise(r => resolve = r)); configure({ remote: true, api: 'roles' });
    const pending = component.initializeOptions(); expect(component.isLoading).toBeTrue(); expect(component.formGroup.get('choice')?.disabled).toBeTrue();
    expect(service.getData).toHaveBeenCalledWith('roles', undefined); resolve(options); await pending;
    expect(component.availableOptions).toEqual(options); expect(component.isLoading).toBeFalse(); expect(component.formGroup.get('choice')?.enabled).toBeTrue();
  });
  it('enables the control and stops loading after an empty remote response', async () => {
    service.getData.and.resolveTo([]); configure({ remote: true, api: 'roles' }); await component.initializeOptions();
    expect(component.availableOptions).toEqual([]); expect(component.isLoading).toBeFalse(); expect(component.formGroup.get('choice')?.enabled).toBeTrue();
  });
  it('silently converts a remote error to an empty result, enables and stops loading', async () => {
    service.getData.and.rejectWith(new Error('offline')); configure({ remote: true, api: 'roles' }); await component.initializeOptions();
    expect(component.availableOptions).toEqual([]); expect(component.isLoading).toBeFalse(); expect(component.formGroup.get('choice')?.enabled).toBeTrue();
  });
  it('filters local cascade options by the initial parent signal value', async () => {
    configure({ parent: 'region' }); fixture.componentRef.setInput('parentValue', 'south'); fixture.detectChanges();
    await component.initializeOptions();
    expect(component.availableOptions).toEqual([options[1]]);
  });
  it('reactively filters local cascade options when the parent changes', async () => {
    configure({ parent: 'region' }); fixture.componentRef.setInput('parentValue', 'north'); fixture.detectChanges();
    await component.initializeOptions(); expect(component.availableOptions).toEqual([options[0]]);
    fixture.componentRef.setInput('parentValue', 'south'); fixture.detectChanges(); await fixture.whenStable();
    expect(component.availableOptions).toEqual([options[1]]);
  });
  it('clears local child options and value when its parent becomes empty', async () => {
    configure({ parent: 'region' }); fixture.componentRef.setInput('parentValue', 'south'); fixture.detectChanges(); await component.initializeOptions();
    component.formGroup.get('choice')?.setValue(2); component.selectedValue = 2;
    fixture.componentRef.setInput('parentValue', ''); fixture.detectChanges(); await fixture.whenStable();
    expect(component.availableOptions).toEqual([]); expect(component.formGroup.get('choice')?.value).toBeNull(); expect(component.selectedValue).toBeNull();
  });
  it('starts an empty cascade child when the configured parent is empty', async () => {
    configure({ parent: 'region' }); fixture.componentRef.setInput('parentValue', ''); fixture.detectChanges();
    component.formGroup.get('choice')?.setValue(2); await component.initializeOptions();
    expect(component.availableOptions).toEqual([]); expect(component.formGroup.get('choice')?.value).toBeNull();
  });
  [0, false].forEach(parent => {
    it(`reacts to the explicit falsy parent ${parent}`, async () => {
      const falsyOptions = [{ id: 1, parent: 0 }, { id: 2, parent: false }, { id: 3, parent: 'north' }];
      configure({ parent: 'region', options: falsyOptions }); fixture.componentRef.setInput('parentValue', 'north'); fixture.detectChanges(); await fixture.whenStable();
      expect(component.availableOptions).toEqual([falsyOptions[2]]);
      fixture.componentRef.setInput('parentValue', parent); fixture.detectChanges(); await fixture.whenStable();
      expect(component.availableOptions).toEqual(falsyOptions.filter(option => option.parent === parent));
    });
  });
  it('reloads remote cascade options with the current parent value', async () => {
    service.getData.and.resolveTo(options); configure({ remote: true, api: 'cities', parent: 'region' });
    fixture.componentRef.setInput('parentValue', 'IT'); fixture.detectChanges(); await component.initializeOptions();
    fixture.componentRef.setInput('parentValue', 'FR'); fixture.detectChanges(); await fixture.whenStable();
    expect(service.getData).toHaveBeenCalledWith('cities', '/FR');
  });
  it('does not call a remote child API when its configured parent is empty', async () => {
    configure({ remote: true, api: 'cities', parent: 'region' }); fixture.componentRef.setInput('parentValue', ''); fixture.detectChanges();
    await component.initializeOptions();
    expect(service.getData).not.toHaveBeenCalled(); expect(component.availableOptions).toEqual([]); expect(component.formGroup.get('choice')?.value).toBeNull();
  });
  it('passes a slash-prefixed parent path to remote getData', async () => {
    service.getData.and.resolveTo(options); configure({ remote: true, api: 'cities', parent: 'region' });
    fixture.componentRef.setInput('parentValue', 'IT'); fixture.detectChanges(); await fixture.whenStable(); await component.initializeOptions();
    expect(service.getData).toHaveBeenCalledWith('cities', '/IT');
    expect(component.isLoading).toBeFalse(); expect(component.formGroup.get('choice')?.enabled).toBeTrue();
  });
  it('emits selectedValue, component, options and parent field', async () => {
    configure({ parent: 'region' }); fixture.componentRef.setInput('parentValue', 'south'); await component.initializeOptions(); const emit = spyOn(component.valueChange, 'emit');
    component.formGroup.get('choice')?.setValue(2); const event = { target: { value: '2' } }; component.onValueChange(event);
    expect(emit).toHaveBeenCalledWith({ event, selectedValue: 2, component, selectOptions: component.selectOptions, parentField: 'region' } as any);
  });
  it('preserves boolean and numeric option values from the FormControl', async () => {
    const typedOptions = [{ id: 0, title: 'Zero' }, { id: false, title: 'False' }]; configure({ options: typedOptions }); await component.initializeOptions();
    const emit = spyOn(component.valueChange, 'emit'); component.formGroup.get('choice')?.setValue(false); component.onValueChange({ target: { value: 'false' } });
    expect(component.selectedValue).toBe(false); expect(emit.calls.mostRecent().args[0].selectedValue).toBe(false);
    component.formGroup.get('choice')?.setValue(0); component.onValueChange({ target: { value: '0' } });
    expect(component.selectedValue).toBe(0); expect(emit.calls.mostRecent().args[0].selectedValue).toBe(0);
  });
  it('emits the complete typed array for a multiple selection change', async () => {
    const typedOptions = [{ id: 1, title: 'One' }, { id: false, title: 'False' }]; configure({ multiple: true, options: typedOptions }); component.values = []; await component.initializeOptions();
    const emit = spyOn(component.valueChange, 'emit'); component.formGroup.get('choice')?.setValue([1, false]); component.onValueChange({ target: { value: 'false' } });
    expect(component.selectedValue).toEqual([1, false]); expect(emit.calls.mostRecent().args[0].selectedValue).toEqual([1, false]);
  });
});
