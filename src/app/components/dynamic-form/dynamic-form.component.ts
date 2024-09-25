import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';


import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DynamicFormField } from '../../interface/dynamic-form-field';
import { FormService } from '../../services/form.service';
import { alert } from '../../widgets/ui-dialogs';
import { CommonModule } from '@angular/common';
import { DynamicSelectBoxComponent } from './items/dynamic-select-box/dynamic-select-box.component';

@Component({
  selector: 'app-dynamic-form',
  standalone:true,
  imports:[CommonModule,DynamicSelectBoxComponent,FormsModule,ReactiveFormsModule],
  templateUrl: './dynamic-form.component.html',
  styleUrls: ['./dynamic-form.component.scss'],


})

export class DynamicFormComponent {
  [x: string]: any;


  @Input() service: string | undefined;
  @Input() editData: any  | undefined;

  @Output() submitFormEvent: EventEmitter<any> = new EventEmitter<any>(); //Emit all'esterno;
  form: FormGroup = new FormGroup({});
  formValues: { [key: string]: any } = {};
  dataSet: any = []
  fields: DynamicFormField[] = [];
  formShow: boolean = false
  fieldConfigs: any = [];
  templateService=inject(FormService)
  inEdit:boolean=true



  ngOnInit(): void {

    if (!this.service) {
      return
    }
    if (typeof this.editData === 'undefined') {
      this.editData = {};
      this.inEdit = false
    }
    this.templateService.getFormFields(this.service).subscribe(fields => {
      this.fields = fields;
      this.initializeForm();
    });


  }

  initializeForm() {
    // Inizializza editData come oggetto vuoto se è undefined
    this.editData = this.editData || {};
  
    const formGroup = new FormGroup({});
  
    this.fields.forEach(field => {

      let validators = this.getValidators(field);
      
      // Recupera il valore dall'editData o imposta null come valore predefinito
      const value = this.editData[field.name] || null;
  
      // Aggiungi il controllo al formGroup con i validatori come terzo argomento
      formGroup.addControl(field.name, new FormControl(value, validators));
  
      // Inizializza i valori del form
      this.initializeFormValues(field);
    });
  
    this.form = formGroup;
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
    
    if(typeof this.editData[field.name] != 'undefined'){
      this.formValues[field.name] = this.editData[field.name];
      //this.formValues[field.name] = field.type === 'selectBox' && field.multiple ? this.editData[field.name] : this.editData[field.name];
      
    }

    this.fieldConfigs[field.name] = field
  }

  onValueChange(fieldName: string, value: any) {
   
    
    
    const control = this.form.get(fieldName);

    if (control && control.value !== value) {
    /*
    { emitEvent: false }, Angular non emette l'evento valueChanges per il controllo specificato. Questo è utile in diverse situazioni come  Evitare Loop Ricorsivi
    */
      control.setValue(value, { emitEvent: false });
      this.formValues[fieldName] = value;
    }
   
    // Trigger cascade updates
    if (this.fieldConfigs[fieldName]) {
      this.updateCascadeOptions(fieldName, value);
    }
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


  submitForm() {
    if (this.form.valid) {
      let eventT={
        name:'submitForm',
        formData:this.form.value,
        form:this.form,
        inEdit:this.inEdit
      }
      this.submitFormEvent.emit(eventT);
    } else {
      const invalidFields = this.getInvalidFields(this.form);


      this.presentToast(`Mancano i seguenti campi:${invalidFields.join(', ')}`);
    }
  }
  cancellForm(){
    let eventT={
      name:'cancelForm',
      formData:this.form.value,
      form:this.form
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
  alert(message,'Errore!')
}

}
