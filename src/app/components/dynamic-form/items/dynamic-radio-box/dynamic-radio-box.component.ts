import { CommonModule } from '@angular/common';
import { Component, effect, EventEmitter, inject, Input, input, Output } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DynamicFormField, RadioOptions } from '../../../../interface/dynamic-form-field';
import { FormService } from '../../../../services/form.service';

@Component({
  selector: 'app-dynamic-radio-box',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './dynamic-radio-box.component.html',
  styleUrls: ['./dynamic-radio-box.component.scss']
})
export class DynamicRadioBoxComponent {
  @Input() config!: DynamicFormField;
  @Input() formGroup!: any;
  @Input() disabled = false;
  @Input() value: any;
  @Output() valueChange = new EventEmitter<any>();

  parentValue = input<any>();
  formControlD!: FormControl;
  formService = inject(FormService);
  availableOptions: any[] = [];
  isLoading = true;
  radioOptions!: RadioOptions;
  displayExp = 'value';
  valueExp = 'id';
  isRemote = false;
  fieldName = '';
  selectedValue: any;

  constructor() {
    effect(() => {
      const parentValue = this.parentValue();
      if (parentValue !== null && typeof parentValue !== 'undefined' && parentValue !== '') {
        this.filterOptionsBasedOnParent();
      }
    });
  }

  ngOnInit(): void {
    this.initializeOptions();
  }

  async initializeOptions(): Promise<void> {
    if (this.config && this.config.radioOptions) {
      this.fieldName = this.config.name;
      this.formControlD = this.formGroup.get(this.fieldName) as FormControl;
      this.radioOptions = this.config.radioOptions;
      this.displayExp = this.radioOptions.displayExp || 'value';
      this.valueExp = this.radioOptions.valueExp || 'id';
      this.isRemote = this.radioOptions.remote;
      this.selectedValue = this.formControlD?.value;

      if (this.isRemote) {
        this.availableOptions = await this.getRemoteOptions(this.radioOptions.api);
      } else {
        this.availableOptions = this.radioOptions.options || [];
        this.isLoading = false;
      }

      if (this.radioOptions.parent && this.hasParentValue()) {
        this.availableOptions = this.availableOptions.filter(option => option.parent === this.parentValue());
      }
    }
  }

  async getRemoteOptions(api: any, queryString?: any): Promise<any[]> {
    this.isLoading = true;
    this.formControlD?.disable();
    let result: any[] = [];
    if (this.hasParentValue()) {
      queryString = `/${this.parentValue()}`;
    }
    try {
      result = await this.formService.getData(api, queryString);
    } catch (error) {
      result = [];
    }
    this.isLoading = false;
    this.formControlD?.enable();
    return result;
  }

  async filterOptionsBasedOnParent(): Promise<void> {
    if (!this.radioOptions) {
      return;
    }
    if (this.isRemote) {
      this.availableOptions = await this.getRemoteOptions(this.radioOptions.api, this.parentValue());
    } else if (this.radioOptions.parent) {
      this.availableOptions = (this.radioOptions.options || []).filter(option => option.parent === this.parentValue());
    }
  }

  onValueChange(event: any): void {
    this.selectedValue = event.target.value;
    this.valueChange.emit({
      event,
      selectedValue: this.selectedValue,
      component: this,
      radioOptions: this.radioOptions,
      parentField: this.radioOptions.parent
    });
  }

  private hasParentValue(): boolean {
    const parentValue = this.parentValue();
    return parentValue !== null && typeof parentValue !== 'undefined' && parentValue !== '';
  }
}
