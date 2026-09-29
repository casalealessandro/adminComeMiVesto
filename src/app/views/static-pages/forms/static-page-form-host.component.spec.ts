import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { FormService } from '../../../services/form.service';
import { StaticPage } from '../models/static-page.models';
import { StaticPageService } from '../services/static-page.service';
import {
  buildStaticPageInput,
  STATIC_PAGE_FORM,
  StaticPageFormHostComponent,
} from './static-page-form-host.component';

describe('StaticPageFormHostComponent', () => {
  let fixture: ComponentFixture<StaticPageFormHostComponent>;
  let component: StaticPageFormHostComponent;
  let pageService: jasmine.SpyObj<StaticPageService>;

  const page: StaticPage = {
    id: 'privacy',
    slug: 'privacy',
    title: 'Privacy',
    content: 'Privacy content',
    version: 3,
    createdAt: 1,
    updatedAt: 2,
  };

  beforeEach(async () => {
    pageService = jasmine.createSpyObj<StaticPageService>('StaticPageService', [
      'createPage',
      'updatePage',
    ]);

    await TestBed.configureTestingModule({
      imports: [StaticPageFormHostComponent],
      providers: [
        { provide: StaticPageService, useValue: pageService },
        { provide: FormService, useValue: { getFormFields: () => of([]) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StaticPageFormHostComponent);
    component = fixture.componentInstance;
  });

  it('uses the staticPageForm definition and renders DynamicForm', () => {
    fixture.detectChanges();

    const dynamicForm = fixture.nativeElement.querySelector('app-dynamic-form');
    expect(component.formId).toBe(STATIC_PAGE_FORM);
    expect(STATIC_PAGE_FORM).toBe('staticPageForm');
    expect(dynamicForm).toBeTruthy();
  });

  it('keeps create data empty', () => {
    component.itemData = { mode: 'create' };
    expect(component.editData).toBeUndefined();
  });

  it('passes only editable values to DynamicForm in edit mode', () => {
    component.itemData = { mode: 'edit', page };

    expect(component.editData).toEqual({
      slug: 'privacy',
      title: 'Privacy',
      content: 'Privacy content',
    });
    expect(component.editData).not.toEqual(jasmine.objectContaining({ version: 3 }));
  });

  it('builds and submits a trimmed create payload', () => {
    pageService.createPage.and.returnValue(of(page));
    spyOn(component.result, 'emit');

    component.handleForm({
      name: 'submitForm',
      formData: { slug: ' privacy ', title: ' Privacy ', content: ' Content ', version: 99 },
    });

    expect(pageService.createPage).toHaveBeenCalledOnceWith({
      slug: 'privacy',
      title: 'Privacy',
      content: 'Content',
    });
    expect(component.result.emit).toHaveBeenCalledWith({ name: 'saved', page });
  });

  it('updates the current id without sending version', () => {
    component.itemData = { mode: 'edit', page };
    pageService.updatePage.and.returnValue(of(page));

    component.handleForm({
      name: 'submitForm',
      formData: { slug: 'terms', title: 'Terms', content: 'Terms content', version: 4 },
    });

    expect(pageService.updatePage).toHaveBeenCalledOnceWith('privacy', {
      slug: 'terms',
      title: 'Terms',
      content: 'Terms content',
    });
  });

  it('emits cancellation without calling the API', () => {
    spyOn(component.result, 'emit');

    component.handleForm({ name: 'cancelForm', formData: {} });

    expect(component.result.emit).toHaveBeenCalledOnceWith({ name: 'cancelled' });
    expect(pageService.createPage).not.toHaveBeenCalled();
    expect(pageService.updatePage).not.toHaveBeenCalled();
  });

  it('keeps the popup open and reports API errors', () => {
    pageService.createPage.and.returnValue(throwError(() => ({ status: 409 })));
    spyOn(component.result, 'emit');

    component.handleForm({
      name: 'submitForm',
      formData: { slug: 'privacy', title: 'Privacy', content: 'Content' },
    });

    expect(component.error).toBe('Esiste già una pagina con questo slug.');
    expect(component.result.emit).not.toHaveBeenCalled();
  });
});

describe('buildStaticPageInput', () => {
  it('selects only the three backend fields', () => {
    expect(buildStaticPageInput({
      slug: ' privacy ',
      title: ' Privacy ',
      content: ' Content ',
      version: 42,
    })).toEqual({ slug: 'privacy', title: 'Privacy', content: 'Content' });
  });
});
