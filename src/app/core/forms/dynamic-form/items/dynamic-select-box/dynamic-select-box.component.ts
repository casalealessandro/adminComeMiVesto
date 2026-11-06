import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject, input, effect, signal, ChangeDetectorRef, DestroyRef } from '@angular/core';
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
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private isDestroyed = false;
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
    this.destroyRef.onDestroy(() => { this.isDestroyed = true; });
    // Esegui un effetto reattivo per filtrare le opzioni quando il valore del parent cambia
    effect(() => {
      const currentParent = this.parentValue(); // Registra la dipendenza reattiva anche quando il parent viene svuotato
      if (this.selectOptions?.parent && sessionStorage.getItem('forms-cascade-debug') === '1') {
        console.debug('[forms:cascade] parent input', { field: this.fieldName, parent: currentParent });
      }
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
      if (this.selectOptions.parent && sessionStorage.getItem('forms-cascade-debug') === '1') {
        console.debug('[forms:cascade] child config', {
          field: this.fieldName, parentField: this.selectOptions.parent,
          remote: this.selectOptions.remote, api: this.selectOptions.api
        });
      }
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
          // Keep remote options visible even if the Promise resolves outside Angular change detection.
          if (!this.isDestroyed) this.changeDetector.detectChanges();
        }
      }else{
        this.availableOptions = this.normalizeOptions(this.selectOptions.options, 'local');
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
      if (this.selectOptions?.parent && sessionStorage.getItem('forms-cascade-debug') === '1') {
        console.warn('[forms:cascade] remote request failed', {
          field: this.fieldName, message: error instanceof Error ? error.message : String(error)
        });
      }
    }
    this.isLoading=false;
    this.formControlD?.enable();
    

    return this.normalizeOptions(res, 'remote');
  }

  private normalizeOptions(result: any, source: 'local' | 'remote'): any[] {
    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.data)) return result.data;

    if (result != null && sessionStorage.getItem('forms-cascade-debug') === '1') {
      console.warn('[forms:cascade] non-array options', {
        field: this.fieldName, source, api: this.selectOptions?.api,
        responseType: typeof result, keys: typeof result === 'object' ? Object.keys(result).slice(0, 10) : []
      });
    }
    return [];
  }

  

  async filterOptionsBasedOnParent() :Promise<void> {

    if (this.isRemote) {
      const requestedParent = this.parentValue();
      if (sessionStorage.getItem('forms-cascade-debug') === '1') {
        console.debug('[forms:cascade] remote request', {
          field: this.fieldName, api: this.selectOptions.api, parent: requestedParent
        });
      }
      const options = await this.getRemoteOptions(this.selectOptions.api, requestedParent);
      if (sessionStorage.getItem('forms-cascade-debug') === '1') {
        console.debug('[forms:cascade] remote response', {
          field: this.fieldName, isArray: Array.isArray(options),
          count: Array.isArray(options) ? options.length : null
        });
      }
      if (!this.hasParentValue() || this.parentValue() !== requestedParent) {
        return;
      }
      this.availableOptions = options;
      if (!this.isDestroyed) this.changeDetector.detectChanges();
    } else if (this.selectOptions && this.selectOptions.parent) {
      this.availableOptions = this.normalizeOptions(this.selectOptions.options, 'local')
        .filter((option:any) => option.parent === this.parentValue());
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
