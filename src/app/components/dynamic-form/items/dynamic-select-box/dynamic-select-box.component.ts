import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject } from '@angular/core';
import { FormControl, FormGroup, FormsModule } from '@angular/forms';
import { DynamicFormField } from '../../../../interface/dynamic-form-field';
import { CommonModule } from '@angular/common';
import { FormService } from '../../../../services/form.service';



@Component({
  selector: 'app-dynamic-select-box',
  templateUrl: './dynamic-select-box.component.html',
  standalone:true,
  imports:[CommonModule,FormsModule],
  styleUrls: ['./dynamic-select-box.component.scss'],
})
export class DynamicSelectBoxComponent implements OnChanges {
  @Input() config!: DynamicFormField;
  @Input() formControlD!: FormControl;
  @Input() parentValue!: string;
  @Input() disabled = false;
  @Input() value:any;
  @Input() values:any = [];
  @Output() valueChange = new EventEmitter<string | string[]>();

  formService=inject(FormService)  
  availableOptions: any = [];
 
  selectOptions:any
  displayExp:any;
  valueExp:any;
  isRemote:boolean =false;

  selectedValue!: string | string[];
  multiple: boolean= false;
  
  ngOnInit(): void {
    this.initializeOptions();
  }

  async initializeOptions(): Promise<void> {
    if (this.config && this.config.selectOptions) {
      this.selectOptions = this.config.selectOptions;
      this.displayExp = this.selectOptions.displayExp || 'value';
      this.valueExp = this.selectOptions.valueExp || 'id';
      this.isRemote = this.selectOptions.remote;
      if(this.isRemote){
        this.availableOptions = await this.getRemoteOptions(this.selectOptions.api)
      }else{
        this.availableOptions = this.selectOptions.options || [];
      }
      
      
      if (this.config.selectOptions.parent && this.parentValue) {
        this.availableOptions = this.availableOptions.filter((option:any) => option.parent === this.parentValue);
      }

      console.log(this.selectOptions)

      if(this.selectOptions.multiple){
        this.multiple = this.selectOptions.multiple
      }

      this.selectedValue = this.selectOptions.multiple ? this.values : this.value;

      this.formControlD?.setValue(this.selectedValue)
      //this.multiple = this.selectOptions.multiple || false;
    }
  }
  async getRemoteOptions(api: any,queryString?:any): Promise<any[]> {
    let res = []
    if(this.parentValue){
      queryString = `/${this.parentValue}`
    }
    try {
      res = await  this.formService.getData(api,queryString);
    } catch (error) {
      
    }
    

    return res
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['parentValue'] || changes['config']) {
      if(typeof changes['parentValue']['currentValue'] != 'undefined' && changes['parentValue']['currentValue'] !== '')
        this.filterOptionsBasedOnParent();
    }
  }

  async filterOptionsBasedOnParent() {
    const  selectOptions  = this.selectOptions;
    if(this.isRemote){
      this.availableOptions = await this.getRemoteOptions(selectOptions.api)
    }else if (selectOptions && selectOptions.parent && this.parentValue) {
      this.availableOptions = selectOptions.options.filter((option: any) => option.parent === this.parentValue);
    } else {
      this.availableOptions = selectOptions.options;
    }
  }

  onValueChange(event: any) {

   

    this.valueChange.emit(this.selectedValue); 
  }
}
