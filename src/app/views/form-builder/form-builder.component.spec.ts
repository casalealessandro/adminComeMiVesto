import { TestBed } from '@angular/core/testing';
import { convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormBuilderComponent } from './form-builder.component';
import { FormService } from '../../services/form.service';
import { PopUpService } from '../../services/popup.service';

describe('FormBuilderComponent', () => {
  it('initializes /form-builder/new without loading a backend form', () => {
    const formService = jasmine.createSpyObj<FormService>('FormService', ['getFormById']);
    const route = { paramMap: of(convertToParamMap({ id: 'new' })) } as any;
    const router = jasmine.createSpyObj('Router', ['navigate']);
    const modal = jasmine.createSpyObj<NgbModal>('NgbModal', ['open']);
    const popup = jasmine.createSpyObj<PopUpService>('PopUpService', [], { outputComponent: of({}) });
    TestBed.configureTestingModule({ providers: [
      { provide: FormService, useValue: formService },
      { provide: PopUpService, useValue: popup }
    ] });
    const component = TestBed.runInInjectionContext(() => new FormBuilderComponent(modal, route, router));

    component.formName = 'stale';
    component.formElements = [{ type: 'textBox' }];
    component.ngOnInit();

    expect(component.formTitle).toBe('Crea Nuovo Form');
    expect(component.formName).toBe('');
    expect(component.formElements).toEqual([]);
    expect(formService.getFormById).not.toHaveBeenCalled();
  });
});
