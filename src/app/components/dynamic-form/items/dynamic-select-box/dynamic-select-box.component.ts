import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject, input, effect, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DynamicFormField } from '../../../../interface/dynamic-form-field';
import { CommonModule } from '@angular/common';
import { FormService } from '../../../../services/form.service';



@Component({
  selector: 'app-dynamic-select-box',
  templateUrl: './dynamic-select-box.component.html',
  standalone:true,
  imports:[CommonModule,FormsModule,ReactiveFormsModule],
  styleUrls: ['./dynamic-select-box.component.scss'],
})
export class DynamicSelectBoxComponent  {
  @Input() config!: DynamicFormField;
  
  @Input() formGroup!: any
 
  @Input() disabled = false;
  @Input() value:any;
  @Input() values:any = [];
  @Output() valueChange = new EventEmitter<string | string[]>();
  
  // Utilizzo di input<string>() per il parent value
  parentValue = input<any>();
  formControlD!:FormControl
  formService=inject(FormService)  
  availableOptions: any = [];
  isLoading:boolean=true
  selectOptions:any
  displayExp:any;
  valueExp:any;
  isRemote:boolean =false;
  fieldName:string = '';
  selectedValue!: string | string[];
  multiple: boolean= false;
  
  constructor() {
    // Esegui un effetto reattivo per filtrare le opzioni quando il valore del parent cambia
    effect(() => {
      const parentValue = this.parentValue(); // Usa la funzione per ottenere il valore attuale del signal
      if (parentValue) {
        this.filterOptionsBasedOnParent();
      }
    });
  }
  ngOnInit (): void {
    this.initializeOptions();

    
  }

  async initializeOptions(): Promise<void> {

    if (this.config && this.config.selectOptions) {
      this.fieldName = this.config.name;
      this.formControlD = this.formGroup.get(this.fieldName) as FormControl;
      this.selectOptions = this.config.selectOptions;
      this.displayExp = this.selectOptions.displayExp || 'value';
      this.valueExp = this.selectOptions.valueExp || 'id';
      this.isRemote = this.selectOptions.remote;
      if(this.selectOptions.multiple){
        this.multiple = this.selectOptions.multiple
      }

      this.selectedValue = this.selectOptions.multiple ? this.values : this.value;

      //this.formControlD?.setValue(this.selectedValue)

      if(this.isRemote){
        this.availableOptions = await this.getRemoteOptions(this.selectOptions.api)
      }else{
        this.availableOptions = this.selectOptions.options || [];
      }
      
      
      if (this.config.selectOptions.parent && this.parentValue) {
        this.availableOptions = this.availableOptions.filter((option:any) => option.parent === this.parentValue);
      }

      //console.log(this.selectOptions)

    
      //this.multiple = this.selectOptions.multiple || false;
    }
  }
  async getRemoteOptions(api: any,queryString?:any): Promise<any[]> {
    this.isLoading = true;
    this.formControlD?.disable();
    let res = []
    if(this.parentValue()){
      queryString = `/${this.parentValue()}`
    }
    try {
      res = await  this.formService.getData(api,queryString);
      if(res.length>0){
        this.isLoading=false;
        this.formControlD?.enable();
      }
    } catch (error) {
      
    }
    

    return res
  }

  

  async filterOptionsBasedOnParent() :Promise<void> {

    if (this.isRemote) {
      this.availableOptions = await this.getRemoteOptions(this.selectOptions.api, this.parentValue());
    } else if (this.selectOptions && this.selectOptions.parent) {
      this.availableOptions = this.selectOptions.options.filter((option:any) => option.parent === this.parentValue());
    }
  }

  onValueChange(event: any) {
   this.selectedValue = event.target.value;
   let changes:any ={
     event: event,
     selectedValue: this.selectedValue,
     component: this,
     selectOptions:this.selectOptions,
     parentField:this.selectOptions.parent
   }

    this.valueChange.emit(changes); 
  }
}
