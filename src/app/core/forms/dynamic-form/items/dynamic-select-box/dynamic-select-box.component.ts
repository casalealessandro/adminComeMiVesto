import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject, input, effect, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DynamicFormField } from '../../../../interface/dynamic-form-field';
import { CommonModule } from '@angular/common';
import { FORM_OPTIONS_PROVIDER } from '../../../../services/form-options-provider';



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
  formService=inject(FORM_OPTIONS_PROVIDER)  
  availableOptions: any = [];
  isLoading:boolean=true
  selectOptions:any
  displayExp:any;
  valueExp:any;
  isRemote:boolean =false;
  fieldName:string = '';
  selectedValue:any;
  multiple: boolean= false;
  
  constructor() {
    // Esegui un effetto reattivo per filtrare le opzioni quando il valore del parent cambia
    effect(() => {
      this.parentValue(); // Registra la dipendenza reattiva anche quando il parent viene svuotato
      if (!this.selectOptions || !this.selectOptions.parent) {
        return;
      }
      if (this.hasParentValue()) {
        this.filterOptionsBasedOnParent();
      } else {
        this.clearCascadeState();
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

      this.selectedValue = this.formControlD?.value ?? (this.selectOptions.multiple ? this.values : this.value);

      if (this.selectOptions.parent && !this.hasParentValue()) {
        this.clearCascadeState();
        return;
      }

      if(this.isRemote){
        if (this.selectOptions.parent) {
          await this.filterOptionsBasedOnParent();
        } else {
          this.availableOptions = await this.getRemoteOptions(this.selectOptions.api)
        }
      }else{
        this.availableOptions = this.selectOptions.options || [];
        this.isLoading = false;
      }
      
      
      if (this.selectOptions.parent && this.hasParentValue() && !this.isRemote) {
        this.availableOptions = this.availableOptions.filter((option:any) => option.parent === this.parentValue());
      }

      //console.log(this.selectOptions)

    
      //this.multiple = this.selectOptions.multiple || false;
    }
  }
  async getRemoteOptions(api: any,queryString?:any): Promise<any[]> {
    this.isLoading = true;
    this.formControlD?.disable();
    let res = []
    if(this.hasParentValue()){
      queryString = `/${this.parentValue()}`
    }
    try {
      res = await  this.formService.getData(api,queryString);
    } catch (error) {
      
    }
    this.isLoading=false;
    this.formControlD?.enable();
    

    return res
  }

  

  async filterOptionsBasedOnParent() :Promise<void> {

    if (this.isRemote) {
      const requestedParent = this.parentValue();
      const options = await this.getRemoteOptions(this.selectOptions.api, requestedParent);
      if (!this.hasParentValue() || this.parentValue() !== requestedParent) {
        return;
      }
      this.availableOptions = options;
    } else if (this.selectOptions && this.selectOptions.parent) {
      this.availableOptions = (this.selectOptions.options || []).filter((option:any) => option.parent === this.parentValue());
    }
  }

  onValueChange(event: any) {
   const controlValue = this.formControlD?.value;
   this.selectedValue = typeof controlValue !== 'undefined' ? controlValue : event.target.value;
   let changes:any ={
     event: event,
     selectedValue: this.selectedValue,
     component: this,
     selectOptions:this.selectOptions,
     parentField:this.selectOptions.parent
   }

    this.valueChange.emit(changes); 
  }

  private hasParentValue(): boolean {
    const parentValue = this.parentValue();
    return parentValue !== null && typeof parentValue !== 'undefined' && parentValue !== '';
  }

  private clearCascadeState(): void {
    this.availableOptions = [];
    this.isLoading = false;
    const emptyValue = this.multiple ? [] : null;
    this.selectedValue = emptyValue;
    this.formControlD?.setValue(emptyValue, { emitEvent: false });
    this.formControlD?.enable();
    if (this.selectOptions) {
      this.valueChange.emit({
        event: null,
        selectedValue: emptyValue,
        component: this,
        selectOptions: this.selectOptions,
        parentField: this.selectOptions.parent
      } as any);
    }
  }
}
