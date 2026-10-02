import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import Quill from 'quill';
import { Subscription } from 'rxjs';
import { DynamicFormField, EditorOptions } from '../../../../interface/dynamic-form-field';

@Component({
  selector: 'app-dynamic-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dynamic-editor.component.html',
  styleUrls: ['./dynamic-editor.component.scss']
})
export class DynamicEditorComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() config!: DynamicFormField;
  @Input() formGroup!: FormGroup;
  @Input() value: string | null | undefined;
  @Input() disabled = false;
  @Output() valueChange = new EventEmitter<string>();
  @ViewChild('editorHost', { static: true }) editorHost!: ElementRef<HTMLElement>;

  editorOptions: EditorOptions = {};
  private editor?: Quill;
  private formControl?: FormControl;
  private subscriptions = new Subscription();

  ngOnInit(): void {
    this.editorOptions = this.config.editorOptions || {};
  }

  ngAfterViewInit(): void {
    this.formControl = this.formGroup.get(this.config.name) as FormControl;
    this.editor = new Quill(this.editorHost.nativeElement, {
      theme: this.editorOptions.theme || 'snow',
      placeholder: this.editorOptions.placeholder || this.config.placeholder,
      formats: ['header', 'bold', 'italic', 'underline', 'list', 'link', 'blockquote'],
      modules: {
        toolbar: {
          container: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'blockquote'],
            ['undo', 'redo']
          ],
          handlers: {
            undo: () => this.editor?.history.undo(),
            redo: () => this.editor?.history.redo()
          }
        }
      }
    });

    this.setEditorValue(this.formControl?.value ?? this.value ?? '');
    this.updateDisabledState();
    this.editor.on('text-change', (_delta, _oldDelta, source) => {
      if (source !== 'user') return;
      const html = this.editorHtml();
      this.formControl?.markAsDirty();
      this.formControl?.markAsTouched();
      this.valueChange.emit(html);
    });
    if (this.formControl) {
      this.subscriptions.add(this.formControl.valueChanges.subscribe(value => {
        if (!this.editorValueMatches(value)) this.setEditorValue(value);
      }));
      this.subscriptions.add(this.formControl.statusChanges.subscribe(() => this.updateDisabledState()));
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private editorHtml(): string {
    const html = this.editor?.root.innerHTML || '';
    return html === '<p><br></p>' ? '' : html;
  }

  private editorValueMatches(value: unknown): boolean {
    return (value == null ? '' : String(value)) === this.editorHtml();
  }

  private setEditorValue(value: unknown): void {
    this.editor?.clipboard.dangerouslyPasteHTML(value == null ? '' : String(value), 'api');
  }

  private updateDisabledState(): void {
    this.editor?.enable(!this.disabled && !this.formControl?.disabled);
  }
}
