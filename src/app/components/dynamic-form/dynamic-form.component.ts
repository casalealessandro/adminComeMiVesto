import { Component, EventEmitter, inject, Input, Output, signal, SimpleChanges } from '@angular/core';


import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DynamicFormField } from '../../interface/dynamic-form-field';
import { FormService } from '../../services/form.service';
import { alert } from '../../widgets/ui-dialogs';
import { CommonModule } from '@angular/common';
import { DynamicSelectBoxComponent } from './items/dynamic-select-box/dynamic-select-box.component';
import { DynamicFileBoxComponent } from './items/dynamic-file-box/dynamic-file-box.component';
import { DynamicRadioBoxComponent } from './items/dynamic-radio-box/dynamic-radio-box.component';
import { CustomScrollbarComponent } from "../custom-scrollbar/custom-scrollbar.component";
import { CloseOverlayOnScrollDirective } from '../custom-scrollbar/close-overlay-on-scroll.directive';

@Component({
  selector: 'app-dynamic-form',
  standalone: true,
  imports: [CommonModule, DynamicSelectBoxComponent, DynamicRadioBoxComponent, DynamicFileBoxComponent, FormsModule, ReactiveFormsModule, CustomScrollbarComponent, CloseOverlayOnScrollDirective],
  templateUrl: './dynamic-form.component.html',
  styleUrls: ['./dynamic-form.component.scss'],
})

export class DynamicFormComponent {


  @Input() service: string | undefined;
  @Input() editData: any | undefined;
  @Input() idData: any | undefined;
  /** Generic pending state controlled by the form consumer. */
  @Input() loading = false;

  /**Botton funzionali***/
  @Input() showBottomButtons: boolean = true;
  @Input() showBottomButtonLeft: boolean = true;
  @Input() showBottomButtonRight: boolean = true;

  @Input() inputBtnRightName!: string

  @Input() inputBtnLeftName!: string

  @Output() submitFormEvent: EventEmitter<any> = new EventEmitter<any>(); //Emit all'esterno;
  @Output() functionalInputFormEvent: EventEmitter<any> = new EventEmitter<any>(); //Emit all'esterno;

  form: FormGroup = new FormGroup({});
  formValues: { [key: string]: any } = {};
  dataSet: any = []
  fields: DynamicFormField[] = [];
  formShow: boolean = false
  fieldConfigs: any = {};
  templateService = inject(FormService)
  inEdit: boolean = true
  // Signal per il valore del parent
  parentValues = signal<{ [key: string]: any }>({}); // Mappa per i segnali dei parent
  showPasswordButton: any = {};
  closeButton: string = 'Ritorna';
  submitButton: string = "Salva";
  iconSubmitButton: string = "mdi-content-save-outline";

  ngOnChanges(changes: SimpleChanges) {
    if (changes['editData'] && changes['editData'].currentValue) {
      //this.initializeForm();
    }
  }

  ngOnInit(): void {

    if (!this.service) {
      return
    }
    if (typeof this.editData === 'undefined') {
      this.editData = {};
    }
    this.initializeForm();
  }

  initializeForm() {
    this.templateService.getJson(this.service).subscribe((data: any) => {
      this.dataSet = data
      this.fields = data.fields || [];
      this.fieldConfigs = data.fieldConfigs || {};
      this.createForm();
      this.formShow = true
    })
  }

  createForm() {
    const group: any = {};

    this.fields.forEach(field => {
      const validators = [];
      if (field.required) {
        validators.push(Validators.required);
      }
      if (field.minLength !== undefined) {
        validators.push(Validators.minLength(field.minLength));
      }
      if (field.maxLength !== undefined) {
        validators.push(Validators.maxLength(field.maxLength));
      }
      if (field.typeInput === 'number') {
        if (field.min !== undefined) validators.push(Validators.min(field.min));
        if (field.max !== undefined) validators.push(Validators.max(field.max));
      }

      group[field.name] = new FormControl(this.editData?.[field.name] ?? field.value ?? '', validators);
      this.formValues[field.name] = this.editData?.[field.name] ?? field.value ?? '';
    });

    this.form = new FormGroup(group);
  }

  getParentValues(parent: string | undefined): any {
    if (!parent) return null;
    return this.parentValues()[parent];
  }

  onValueChangeSelectBox(fieldName: string, value: any): void {
    this.formValues[fieldName] = value;
    this.form.get(fieldName)?.setValue(value);
    this.parentValues.update(current => ({ ...current, [fieldName]: value }));
  }

  onValueChange(fieldName: string, value: any): void {
    this.formValues[fieldName] = value;
    this.form.get(fieldName)?.setValue(value);
  }

  toggleFieldTextType(field: DynamicFormField) {
    field.typeInput = field.typeInput === 'password' ? 'text' : 'password';
  }

  onFucBtnClick(field: DynamicFormField) {
    this.functionalInputFormEvent.emit({ field, formData: this.form.getRawValue() });
  }

  submitForm() {
    if (this.loading) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      alert('Compila correttamente i campi richiesti', 'Attenzione');
      return;
    }
    this.submitFormEvent.emit({
      name: 'submitForm',
      formData: this.form.getRawValue()
    });
  }

  closeForm() {
    if (this.loading) return;
    this.submitFormEvent.emit({
      name: 'cancelForm',
      formData: this.form.getRawValue()
    });
  }
}
