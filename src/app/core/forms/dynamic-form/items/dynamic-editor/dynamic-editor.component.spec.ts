import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, Validators } from '@angular/forms';
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
    const editor = fixture.nativeElement.querySelector('.ql-editor') as HTMLElement;
    editor.innerHTML = '<h2>Heading</h2><p><strong>Body</strong></p>';
    editor.dispatchEvent(new Event('input'));
    expect(emit).toHaveBeenCalledWith('<h2>Heading</h2><p><strong>Body</strong></p>');
    expect(control.dirty).toBeTrue();
    expect(control.touched).toBeTrue();
  });

  it('loads a new edit value received by the existing control', () => {
    control.setValue('<blockquote>Updated</blockquote>');
    expect(fixture.nativeElement.querySelector('.ql-editor').innerHTML).toBe('<blockquote>Updated</blockquote>');
  });
});
