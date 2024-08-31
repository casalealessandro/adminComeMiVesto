import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { DynamicFormField } from '../../../../interface/dynamic-form-field';
import { CommonModule } from '@angular/common';



@Component({
  selector: 'app-dynamic-select-box',
  templateUrl: './dynamic-select-box.component.html',
  standalone:true,
  imports:[CommonModule],
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

  
  availableOptions: any = [];
  
  selectOptions:any
  displayExp:any;
  valueExp:any;
  
  selectedValue!: string | string[];
  multiple: boolean= false;
  
  ngOnInit(): void {
    this.initializeOptions();
  }

  initializeOptions(): void {
    if (this.config && this.config.selectOptions) {
      this.selectOptions = this.config.selectOptions;
      this.displayExp = this.selectOptions.displayExp || 'value';
      this.valueExp = this.selectOptions.valueExp || 'id';
      this.availableOptions = this.selectOptions.options || [];
      
      if (this.config.selectOptions.parent && this.parentValue) {
        this.availableOptions = this.availableOptions.filter((option:any) => option.parent === this.parentValue);
      }
      this.selectedValue = this.selectOptions.multiple ? this.values : this.value;

      this.formControlD?.setValue(this.selectedValue)
      this.multiple = this.selectOptions.multiple || false;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['parentValue'] || changes['config']) {
      if(typeof changes['parentValue']['currentValue'] != 'undefined' && changes['parentValue']['currentValue'] !== '')
        this.filterOptionsBasedOnParent();
    }
  }

  filterOptionsBasedOnParent() {
    const  selectOptions  = this.selectOptions;
    
    if (selectOptions && selectOptions.parent && this.parentValue) {
      this.availableOptions = selectOptions.options.filter((option: any) => option.parent === this.parentValue);
    } else {
      this.availableOptions = selectOptions.options;
    }
  }

  onValueChange(event: any) {
    this.selectedValue = event.detail.value;
    this.valueChange.emit(this.selectedValue);
  }
}
