import { TestBed } from '@angular/core/testing';
import { convertToParamMap } from '@angular/router';
import { of, Subject } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilderComponent, buildFormPayload } from './form-builder.component';
import { FormService } from '../../services/form.service';
import { PopUpService } from '../../services/popup.service';

describe('FormBuilderComponent characterization', () => {
  function setup(id: string) {
    const formService = jasmine.createSpyObj<FormService>('FormService', ['getFormById', 'saveForm']);
    formService.getFormById.and.returnValue(of({ id, nameForm: 'Loaded', json: [] })); formService.saveForm.and.resolveTo({});
    const route = { paramMap: of(convertToParamMap({ id })) } as any;
    const router = jasmine.createSpyObj('Router', ['navigate']); const modal = jasmine.createSpyObj<NgbModal>('NgbModal', ['open']);
    const output = new Subject<any>(); const popup = jasmine.createSpyObj<PopUpService>('PopUpService', ['setNewPopUp', 'destroyCurrentOpenPopUpByGuid'], { outputComponent: output });
    TestBed.configureTestingModule({ providers: [{ provide: FormService, useValue: formService }, { provide: PopUpService, useValue: popup }] });
    const component = TestBed.runInInjectionContext(() => new FormBuilderComponent(modal, route, router));
    return { component, formService, router, popup, output };
  }
  it('initializes /form-builder/new without loading a backend form', () => {
    const { component, formService } = setup('new'); component.formName = 'stale'; component.formElements = [{ type: 'textBox' }]; component.ngOnInit();
    expect(component.formTitle).toBe('Crea Nuovo Form'); expect(component.formName).toBe(''); expect(component.formElements).toEqual([]);
    expect(formService.getFormById).not.toHaveBeenCalled();
  });
  it('reads an existing id, loads its name and normalizes metadata', () => {
    const { component, formService } = setup('form/a');
    formService.getFormById.and.returnValue(of({ id: 'form/a', nameForm: 'Profile', json: [{ name: 'bio', type: 'textBox', typeInput: 'text', label: 'Bio', minlength: 2 }] as any }));
    component.ngOnInit(); expect(formService.getFormById).toHaveBeenCalledWith('form/a'); expect(component.formName).toBe('Profile');
    expect(component.formElements[0].minLength).toBe(2); expect(component.formElements[0].minlength).toBeUndefined();
  });
  it('adds at the last index and removes an element', () => {
    const { component } = setup('new'); const open = spyOn(component, 'openPropertiesModal');
    const event = jasmine.createSpyObj('event', ['preventDefault', 'stopPropagation']); component.onAdd(event, 0);
    expect(component.formElements).toEqual([{ type: 'textBox', label: 'Text Box', validation: [] }]);
    expect(open).toHaveBeenCalledWith(component.elements[0], 0); component.onRemove(0); expect(component.formElements).toEqual([]);
  });
  it('moves fields without allowing them outside the form bounds', () => {
    const { component } = setup('new');
    component.formElements = [{ name: 'a' }, { name: 'b' }, { name: 'c' }];
    component.moveElement(1, -1); expect(component.formElements.map(field => field.name)).toEqual(['b', 'a', 'c']);
    component.moveElement(0, -1); expect(component.formElements.map(field => field.name)).toEqual(['b', 'a', 'c']);
    component.moveElement(1, 1); expect(component.formElements.map(field => field.name)).toEqual(['b', 'c', 'a']);
    component.moveElement(2, 1); expect(component.formElements.map(field => field.name)).toEqual(['b', 'c', 'a']);
  });
  it('duplicates a field as an independent copy with a unique technical name', () => {
    const { component } = setup('new');
    component.formElements = [{
      name: 'role', type: 'selectBox', label: 'Ruolo',
      selectOptions: { options: [{ id: 'admin', value: 'Admin' }], multiple: false, remote: false }
    }];
    component.duplicateElement(0);
    expect(component.formElements[1].name).toBe('role_copy');
    expect(component.formElements[1].label).toBe('Ruolo (copia)');
    expect(component.formElements[1]).not.toBe(component.formElements[0]);
    expect(component.formElements[1].selectOptions).not.toBe(component.formElements[0].selectOptions);
    component.formElements[1].selectOptions.options[0].value = 'Changed';
    expect(component.formElements[0].selectOptions.options[0].value).toBe('Admin');
    component.duplicateElement(0);
    expect(component.formElements[1].name).toBe('role_copy2');
  });
  it('buildFormPayload trims the display name, keeps id separate, and normalizes metadata', () => {
    const payload: any = buildFormPayload('technical-id', '  Display name  ', [{ name: 'x', type: 'textBox', typeInput: 'text', label: 'X', maxlength: 3 } as any]);
    expect(payload.id).toBe('technical-id'); expect(payload.nameForm).toBe('Display name');
    expect(payload.json[0].maxLength).toBe(3); expect(payload.json[0].maxlength).toBeUndefined();
  });
  it('keeps Radio Button canonical in the palette and preserves radioOptions in the payload', () => {
    const { component } = setup('new');
    expect(component.elements).toContain(jasmine.objectContaining({ type: 'radio', label: 'Radio Button' }));
    const radioOptions = { displayExp: 'value', valueExp: 'id', options: [{ id: 'U', value: 'Uomo' }], parent: '', remote: false, api: '' };
    const payload = buildFormPayload('profile', 'Profile', [{ name: 'gender', type: 'radio', typeInput: 'radio', label: 'Gender', radioOptions }] as any);
    expect(payload.json[0].type).toBe('radio'); expect(payload.json[0].radioOptions).toEqual(radioOptions); expect(payload.json[0].selectOptions).toBeUndefined();
  });
  it('does not save a form without a name', () => {
    const { component, formService } = setup('new');
    component.formName = '   ';
    component.formElements = [{ name: 'x', type: 'textBox', typeInput: 'text', label: 'X' } as any];
    component.saveForm('ignored');
    expect(formService.saveForm).not.toHaveBeenCalled();
  });
  it('creates a new form with a generated technical id then navigates', async () => {
    const { component, formService, router } = setup('new'); component.ngOnInit(); component.formName = '  New form  ';
    component.formElements = [{ name: 'x', type: 'textBox', typeInput: 'text', label: 'X', minlength: 2 } as any]; component.saveForm('ignored'); await Promise.resolve();
    expect(formService.saveForm).toHaveBeenCalled(); const [serviceId, payload] = formService.saveForm.calls.mostRecent().args as any;
    expect(serviceId).toBe('new'); expect(payload.id).toMatch(/^\d+$/); expect(payload.nameForm).toBe('New form'); expect(payload.json[0].minLength).toBe(2);
    expect(router.navigate).toHaveBeenCalledWith(['/form-list']);
  });
  it('updates an existing form using its route id then navigates', async () => {
    const { component, formService, router } = setup('existing'); component.ngOnInit(); component.formName = ' Renamed '; component.saveForm('ignored'); await Promise.resolve();
    expect(formService.saveForm).toHaveBeenCalledWith('existing', { id: 'existing', nameForm: 'Renamed', json: [] });
    expect(router.navigate).toHaveBeenCalledWith(['/form-list']);
  });
});
