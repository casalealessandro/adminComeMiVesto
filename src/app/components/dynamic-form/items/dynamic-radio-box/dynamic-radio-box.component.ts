import { CommonModule } from '@angular/common';
import { Component, effect, EventEmitter, inject, Input, input, Output } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DynamicFormField, RadioOptions } from '../../../../interface/dynamic-form-field';
import { FORM_OPTIONS_PROVIDER } from '../../../../services/form-options-provider';

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
  formService = inject(FORM_OPTIONS_PROVIDER);
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
      this.parentValue();
      if (!this.radioOptions || !this.radioOptions.parent) {
        return;
      }
      if (this.hasParentValue()) {
        this.filterOptionsBasedOnParent();
      } else {
        this.clearCascadeState();
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

      if (this.radioOptions.parent && !this.hasParentValue()) {
        this.clearCascadeState();
        return;
      }

      if (this.isRemote) {
        if (this.radioOptions.parent) {
          await this.filterOptionsBasedOnParent();
        } else {
          this.availableOptions = await this.getRemoteOptions(this.radioOptions.api);
        }
      } else {
        this.availableOptions = this.radioOptions.options || [];
        this.isLoading = false;
      }

      if (this.radioOptions.parent && this.hasParentValue() && !this.isRemote) {
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
      const requestedParent = this.parentValue();
      const options = await this.getRemoteOptions(this.radioOptions.api, requestedParent);
      if (!this.hasParentValue() || this.parentValue() !== requestedParent) {
        return;
      }
      this.availableOptions = options;
    } else if (this.radioOptions.parent) {
      this.availableOptions = (this.radioOptions.options || []).filter(option => option.parent === this.parentValue());
    }
  }

  onValueChange(event: any, selectedValue?: any): void {
    this.selectedValue = typeof selectedValue !== 'undefined' ? selectedValue : this.formControlD?.value;
    this.formControlD?.setValue(this.selectedValue, { emitEvent: false });
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

  private clearCascadeState(): void {
    this.availableOptions = [];
    this.isLoading = false;
    this.selectedValue = null;
    this.formControlD?.setValue(null, { emitEvent: false });
    this.formControlD?.enable();
    if (this.radioOptions) {
      this.valueChange.emit({
        event: null,
        selectedValue: null,
        component: this,
        radioOptions: this.radioOptions,
        parentField: this.radioOptions.parent
      });
    }
  }
}
