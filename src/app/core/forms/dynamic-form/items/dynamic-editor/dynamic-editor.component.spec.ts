import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import Quill from 'quill';
import { DynamicEditorComponent } from './dynamic-editor.component';

describe('DynamicEditorComponent', () => {
  let fixture: ComponentFixture<DynamicEditorComponent>;
  let component: DynamicEditorComponent;
  let control: FormControl;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DynamicEditorComponent] }).compileComponents();
    fixture = TestBed.createComponent(DynamicEditorComponent);
    component = fixture.componentInstance;
    control = new FormControl('<p>Saved content</p>', [Validators.required, Validators.minLength(5), Validators.maxLength(40)]);
    component.config = {
      name: 'content', type: 'editor', typeInput: 'text', label: 'Content',
      editorOptions: { placeholder: 'Write content', minHeight: 300 }
    };
    component.formGroup = new FormGroup({ content: control });
    fixture.detectChanges();
  });

  it('initializes the editor with the FormControl HTML value', () => {
    expect(fixture.nativeElement.querySelector('.ql-editor').innerHTML).toBe('<p>Saved content</p>');
  });

  it('propagates editor HTML through valueChange', () => {
    const emit = spyOn(component.valueChange, 'emit');
    const editor = (component as any).editor as Quill;
    editor.clipboard.dangerouslyPasteHTML('<h2>Heading</h2><p><strong>Body</strong></p>', 'user');
    expect(emit).toHaveBeenCalledWith(editor.root.innerHTML);
    expect(control.dirty).toBeTrue();
    expect(control.touched).toBeTrue();
  });

  it('loads patch and reset values without treating them as user changes', () => {
    const emit = spyOn(component.valueChange, 'emit');

    control.patchValue('<blockquote>Updated</blockquote>');
    expect(fixture.nativeElement.querySelector('.ql-editor').innerHTML).toBe('<blockquote>Updated</blockquote>');
    expect(control.pristine).toBeTrue();
    expect(control.untouched).toBeTrue();
    expect(emit).not.toHaveBeenCalled();

    control.reset();
    expect(control.value).toBeNull();
    expect(fixture.nativeElement.querySelector('.ql-editor').innerHTML).toBe('<p><br></p>');
    expect(control.pristine).toBeTrue();
    expect(control.untouched).toBeTrue();
    expect(emit).not.toHaveBeenCalled();
  });

  it('initializes editor options before the view check', () => {
    expect(component.editorOptions).toEqual({ placeholder: 'Write content', minHeight: 300 });
    expect(() => fixture.detectChanges()).not.toThrow();
  });
});
