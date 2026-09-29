import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';
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
export class DynamicEditorComponent implements AfterViewInit, OnDestroy {
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

  ngAfterViewInit(): void {
    this.editorOptions = this.config.editorOptions || {};
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
    this.editor.on('text-change', () => {
      const html = this.editorHtml();
      this.formControl?.markAsDirty();
      this.formControl?.markAsTouched();
      this.valueChange.emit(html);
    });
    if (this.formControl) {
      this.subscriptions.add(this.formControl.valueChanges.subscribe(value => {
        if (String(value ?? '') !== this.editorHtml()) this.setEditorValue(value ?? '');
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

  private setEditorValue(value: string): void {
    this.editor?.clipboard.dangerouslyPasteHTML(String(value));
  }

  private updateDisabledState(): void {
    this.editor?.enable(!this.disabled && !this.formControl?.disabled);
  }
}
