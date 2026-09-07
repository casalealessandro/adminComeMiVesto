import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { DynamicSelectBoxComponent } from './dynamic-select-box.component';
import { FormService } from '../../../../services/form.service';

describe('DynamicSelectBoxComponent characterization', () => {
  let component: DynamicSelectBoxComponent;
  let fixture: ComponentFixture<DynamicSelectBoxComponent>;
  let service: jasmine.SpyObj<FormService>;
  const options = [{ id: 1, title: 'One', parent: 'north' }, { id: 2, title: 'Two', parent: 'south' }];

  beforeEach(async () => {
    service = jasmine.createSpyObj<FormService>('FormService', ['getData']);
    await TestBed.configureTestingModule({ imports: [DynamicSelectBoxComponent], providers: [{ provide: FormService, useValue: service }] }).compileComponents();
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
    expect(component.multiple).toBeFalse(); expect(component.selectedValue).toBe(2); expect(component.isLoading).toBeTrue();
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
  it('leaves the control disabled and loading after an empty remote response', async () => {
    service.getData.and.resolveTo([]); configure({ remote: true, api: 'roles' }); await component.initializeOptions();
    expect(component.availableOptions).toEqual([]); expect(component.isLoading).toBeTrue(); expect(component.formGroup.get('choice')?.disabled).toBeTrue();
  });
  it('silently converts a remote error to an empty result and remains disabled/loading', async () => {
    service.getData.and.rejectWith(new Error('offline')); configure({ remote: true, api: 'roles' }); await component.initializeOptions();
    expect(component.availableOptions).toEqual([]); expect(component.isLoading).toBeTrue(); expect(component.formGroup.get('choice')?.disabled).toBeTrue();
  });
  it('filters local cascade options by option.parent', async () => {
    configure({ parent: 'region' }); await component.initializeOptions();
    fixture.componentRef.setInput('parentValue', 'south'); fixture.detectChanges(); await fixture.whenStable();
    await component.filterOptionsBasedOnParent(); expect(component.availableOptions).toEqual([options[1]]);
  });
  it('passes a slash-prefixed parent path to remote getData', async () => {
    service.getData.and.resolveTo(options); configure({ remote: true, api: 'cities', parent: 'region' });
    fixture.componentRef.setInput('parentValue', 'IT'); fixture.detectChanges(); await fixture.whenStable(); await component.initializeOptions();
    expect(service.getData).toHaveBeenCalledWith('cities', '/IT');
  });
  it('emits selectedValue, component, options and parent field', async () => {
    configure({ parent: 'region' }); await component.initializeOptions(); const emit = spyOn(component.valueChange, 'emit');
    const event = { target: { value: 2 } }; component.onValueChange(event);
    expect(emit).toHaveBeenCalledWith({ event, selectedValue: 2, component, selectOptions: component.selectOptions, parentField: 'region' } as any);
  });
});
