import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { DynamicFormField, SelectOptions } from '../dynamic-form-field';
import { confirm } from '../../../widgets/ui-dialogs';
import { DataGridComponent } from '../../../components/data-grid/data-grid.component';

@Component({
  selector: 'app-element',
  standalone: true,
  imports: [CommonModule,FormsModule,ReactiveFormsModule],
  templateUrl: './element.component.html',
  styleUrl: './element.component.scss'
})

export class ElementComponent {

  @Input() formField!: DynamicFormField;

  @Output() outPutProperties = new EventEmitter<any>();
  showSelectOption:boolean =false
  selectOptions!: SelectOptions;
  newOption:any ={}
  optionSelIndex: number = -1;
  ngOnInit(){
   
    if(this.formField.type === 'selectBox'){
    
    this.showSelectOption = true;
    let selectOptions
    if(typeof this.formField.selectOptions != 'undefined'){
      selectOptions = this.formField.selectOptions
      this.selectOptions = {
        multiple:selectOptions.multiple,
        displayExp:selectOptions.displayExp,
        valueExp:selectOptions.valueExp,
        options:selectOptions.options,
        parent:selectOptions.parent
  
      }
    }else{
      this.selectOptions = {
        multiple:false,
        displayExp:'',
        valueExp:'',
        options:[],
        parent:''
      }
      this.formField.selectOptions = this.selectOptions
    }
   
    
    
   }
  }
   // Funzione per aggiungere una nuova opzione all'array
   addOption() {

    let valueExp = this.formField.selectOptions!.valueExp
    let displayExp = this.formField.selectOptions!.displayExp
    
    if(!this.newOption[valueExp] || !this.newOption[displayExp] ){
      return
    }
    
    if(this.optionSelIndex>=0){
      this.selectOptions.options[this.optionSelIndex] = this.newOption
    }else{
      this.selectOptions.options.push(
        this.newOption
      );
    }
    
    
    // Resetta l'oggetto per la prossima nuova opzione
    
    if(this.formField.selectOptions)
      this.newOption = {
        [this.formField.selectOptions.valueExp]:'',
        [this.formField.selectOptions?.displayExp]:'',
        parent:''
      }
      this.optionSelIndex = -1
  }
  // Funzione per selezionare l'opzione e modificare
  onOptionClick(option:any) {
    let valueExp = this.formField.selectOptions!.valueExp
    let displayExp = this.formField.selectOptions!.displayExp
    
      this.newOption = option
      if(this.formField.selectOptions?.options)
        this.optionSelIndex = this.formField.selectOptions?.options.findIndex(optionS=> optionS == option) 
    
    // Resetta l'oggetto per la prossima nuova opzione
    
    
  }

  // Funzione per rimuovere un'opzione dall'array
  removeOption(index: number) {
    this.selectOptions.options.splice(index, 1);
  }

  saveProperties(elementForm:NgForm){

    const valid = this.formPrsValidate(elementForm)

    if(!valid){
      return;
    }

    let outputEmit = {
      name:'saveProperties',
      formField:this.formField
    }
    this.outPutProperties.emit(outputEmit);

  }

  closeProperties(elementForm:NgForm){
    if(!elementForm.valid){
      let outputEmit = {
        name:'closeProperties',
        formField:this.formField
      }
      this.outPutProperties.emit(outputEmit);
    }else{
      confirm('Sei sicuro di voler abbandonare?','Attenzione!',(resp: boolean)=>{
        if(resp){

          let outputEmit = {
            name:'closeProperties',
            formField:this.formField
          }
          this.outPutProperties.emit(outputEmit);
        }
      })   
    }

   
    return;
    let outputEmit = {
      name:'closeProperties',
      formField:this.formField
    }
    this.outPutProperties.emit(outputEmit);
  }

  addValidation(formElement: any) {
    formElement.validation.push({ type: '', value: '' });
  }

  formPrsValidate(elementForm:NgForm):boolean{
    
    if(!elementForm.valid){
      alert('Mancano i campi obbligatori')
      this.markFormGroupTouched(elementForm);
      return false;

    }

    if(this.showSelectOption && this.formField.selectOptions){
      if(this.formField.selectOptions.options.length == 0){
        alert('Mancano i campi le options della select');
        return false
      }
    }

    return true
  }

  markFormGroupTouched(elementForm: NgForm) {
    Object.keys(elementForm.controls).forEach(field => {
      const control = elementForm.control.get(field);
      control?.markAsTouched({ onlySelf: true });
    });
  }
}
