import { TestBed } from '@angular/core/testing';
import { convertToParamMap, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { of, Subject } from 'rxjs';
import { FORM_DEFINITION_REPOSITORY } from '../../services/form-definition-repository';
import { PopUpService } from '../../services/popup.service';
import { FormBuilderComponent } from './form-builder.component';

describe('FormBuilderComponent editor support', () => {
  let component: FormBuilderComponent;
  let repository: jasmine.SpyObj<any>;

  beforeEach(() => {
    repository = jasmine.createSpyObj('FormDefinitionRepository', ['getFormById', 'saveForm']);
    TestBed.configureTestingModule({
      providers: [
        { provide: FORM_DEFINITION_REPOSITORY, useValue: repository },
        { provide: PopUpService, useValue: { setNewPopUp: () => undefined, outputComponent: new Subject() } }
      ]
    });
    const route = { paramMap: of(convertToParamMap({ id: 'new' })) } as any;
    const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    component = TestBed.runInInjectionContext(() => new FormBuilderComponent({} as NgbModal, route, router));
  });

  it('offers and selects the editor field through the existing add flow', () => {
    const editorIndex = component.elements.findIndex(element => element.type === 'editor');
    spyOn(component, 'openPropertiesModal');

    component.onAdd({ preventDefault() {}, stopPropagation() {} }, editorIndex);

    expect(editorIndex).toBeGreaterThanOrEqual(0);
    expect(component.formElements[0]).toEqual(jasmine.objectContaining({ type: 'editor', validation: [] }));
    expect(component.openPropertiesModal).toHaveBeenCalledWith(
      jasmine.objectContaining({ type: 'editor' }),
      0
    );
  });

  it('saves editor options in the normal form definition payload', () => {
    repository.saveForm.and.returnValue(new Promise(() => undefined));
    component.formId = 'legal-pages';
    component.formName = 'Legal pages';
    component.formElements = [{
      name: 'content', type: 'editor', typeInput: 'text', label: 'Contenuto', required: true,
      editorOptions: { theme: 'snow', placeholder: 'Scrivi il contenuto', minHeight: 360 }
    }];

    component.saveForm(component.formName);

    expect(repository.saveForm).toHaveBeenCalledOnceWith('legal-pages', {
      id: 'legal-pages',
      nameForm: 'Legal pages',
      json: [jasmine.objectContaining({
        name: 'content',
        type: 'editor',
        editorOptions: { theme: 'snow', placeholder: 'Scrivi il contenuto', minHeight: 360 }
      })]
    });
  });

  it('reloads persisted editor configuration without losing its options', () => {
    repository.getFormById.and.returnValue(of({
      id: 'legal-pages',
      nameForm: 'Legal pages',
      json: [{
        name: 'content', type: 'editor', typeInput: 'text', label: 'Contenuto',
        editorOptions: { theme: 'snow', placeholder: 'Modifica il contenuto', minHeight: 420 }
      }]
    }));

    component.loadForm('legal-pages');

    expect(component.formElements).toEqual([jasmine.objectContaining({
      name: 'content',
      type: 'editor',
      editorOptions: { theme: 'snow', placeholder: 'Modifica il contenuto', minHeight: 420 }
    })]);
  });
});
