import { Component, effect, EventEmitter, inject, Input, OnInit, Output, Signal, signal, SimpleChanges } from '@angular/core';


import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DynamicFormField } from '../../interface/dynamic-form-field';
import { FormService } from '../../services/form.service';
import { alert } from '../../widgets/ui-dialogs';
import { CommonModule } from '@angular/common';
import { DynamicSelectBoxComponent } from './items/dynamic-select-box/dynamic-select-box.component';
import { DynamicFileBoxComponent } from './items/dynamic-file-box/dynamic-file-box.component';
import { CustomScrollbarComponent } from "../custom-scrollbar/custom-scrollbar.component";

@Component({
  selector: 'app-dynamic-form',
  standalone: true,
  imports: [CommonModule, DynamicSelectBoxComponent, DynamicFileBoxComponent, FormsModule, ReactiveFormsModule, CustomScrollbarComponent],
  templateUrl: './dynamic-form.component.html',
  styleUrls: ['./dynamic-form.component.scss'],
})

export class DynamicFormComponent {


  @Input() service: string | undefined;
  @Input() editData: any | undefined;
  @Input() idData: any | undefined;

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
      this.inEdit = false
    }
    //I dati che servono per fare un insert.
    if (typeof this.idData != 'undefined') {
      this.editData = this.idData
    }
    this.templateService.getFormFields(this.service).subscribe(fields => {
      this.fields = fields;
      this.initializeForm();
    });

    if (this.inputBtnLeftName) {
      this.closeButton = this.inputBtnLeftName;
    }
    if (this.inputBtnRightName) {
      this.iconSubmitButton = ''
      this.submitButton = this.inputBtnRightName;
    }
  }




  initializeForm() {
    // Inizializza editData come oggetto vuoto se è undefined
    this.editData = this.editData || {};

    const formGroup = new FormGroup({});

    this.fields.forEach(field => {

      let validators = this.getValidators(field);

      // Recupera il valore dall'editData o imposta null come valore predefinito
      const value = this.editData[field.name] || null;
      console.log(field.name)
      // Aggiungi il controllo al formGroup con i validatori come terzo argomento
      try {
        formGroup.addControl(field.name, new FormControl(value, validators));
      } catch (error) {
        console.error(`Error setting control for field ${field.name}:`, error);
      }


      // Creazione del segnale per il parent
      if (field.selectOptions && field.selectOptions.parent) {
        const parentField = field.selectOptions.parent;
        this.parentValues.set({ ...this.parentValues(), [parentField]: this.editData[parentField] || '' }); // Inizializza il segnale


      }
      
      if (field.typeInput === 'password') {
        this.showPasswordButton[field.name] = true
      }
      // Inizializza i valori del form
      this.initializeFormValues(field);
    });

    this.form = formGroup;

    console.log(this.form)
  }

  // Metodo separato per gestire i validatori
  private getValidators(field: DynamicFormField) {
    const validators = [];

    if (field.required) {
      validators.push(Validators.required);
    }
    if (typeof field.minlength !== 'undefined') {
      validators.push(Validators.minLength(field.minlength));
    }
    if (typeof field.maxlength !== 'undefined') {
      validators.push(Validators.maxLength(field.maxlength));
    }

    return validators;
  }



  initializeFormValues(field: any) {

    //this.formValues[field.name] = field.type === 'selectBox' && field.multiple ? [] : '';

    if (typeof this.editData[field.name] != 'undefined') {
      this.formValues[field.name] = this.editData[field.name];
      //this.formValues[field.name] = field.type === 'selectBox' && field.multiple ? this.editData[field.name] : this.editData[field.name];

    }

    this.fieldConfigs[field.name] = field
  }

  onValueChange(fieldName: string, value: any) {



    const control = this.form.get(fieldName);

    if (control && control.value !== value) {
      control.setValue(value, { emitEvent: false });
      this.formValues[fieldName] = value;
    }


  }

  onValueChangeSelectBox(fieldName: string, event: any) {
    
    this.onValueChange(fieldName, event.selectedValue);
    // Controllo se fieldName è un parent
    if (fieldName in this.parentValues()) {


      this.parentValues.set({ ...this.parentValues(), [fieldName]: event.selectedValue }); // Imposta il valore del parent
    }
    console.log(this.parentValues())
  }

  getParentValues(parent: any) {
    if (parent) {
      return this.parentValues()[parent]
    }
    return null
  }
  updateCascadeOptions(fieldName: string, value: any) {
    const fieldConfig = this.fieldConfigs[fieldName];
    if (fieldConfig && fieldConfig.cascadeFrom) {

      if (fieldName === fieldConfig.cascadeFrom) {

        const updatedOptions = fieldConfig.cascadeOptions[value] || [];
        this.formValues[fieldName] = updatedOptions;

      }

    }
  }

  toggleFieldTextType(field: DynamicFormField) {

    if (field.typeInput === 'password') {

      field.typeInput = 'text';
    } else {
      field.typeInput = 'password';
    }
  }

  submitForm() {
    if (this.form.valid) {
      let eventT = {
        name: 'submitForm',
        formData: this.form.value,
        form: this.form,
        inEdit: this.inEdit
      }
      this.submitFormEvent.emit(eventT);
    } else {
      const invalidFields = this.getInvalidFields(this.form);


      this.presentToast(`Mancano i seguenti campi:${invalidFields.join(', ')}`);
    }
  }
  cancellForm() {
    let eventT = {
      name: 'cancelForm',
      formData: this.form.value,
      form: this.form,
      component: this
    }
    this.submitFormEvent.emit(eventT);
  }

  // Metodo per ottenere i campi non validi
  getInvalidFields(formGroup: FormGroup): string[] {
    const invalidFields: string[] = [];

    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      if (control && control.invalid) {

        let ff = this.fieldConfigs[field].label
        invalidFields.push(ff);
      }
    });

    return invalidFields;
  }

  async presentToast(message: string) {
    alert(message, 'Errore!')
  }

  onFucBtnClick(evt: any) {
    /* evt.stopPropagation();
    evt.preventDefault(); */

    let send = {
      name: 'functionalInputClick',
      nomeCampo: evt.name,
      allFields: evt
    }

    this.functionalInputFormEvent.emit(send)
  }

  public refresh() {
    this.form.reset()
  }
}
