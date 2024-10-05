import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';

import { confirm } from '../../../widgets/ui-dialogs';
import { DataGridComponent } from '../../../components/data-grid/data-grid.component';
import { CheckBoxOptions, DynamicFormField, FileBoxOptions, SelectOptions } from '../../../interface/dynamic-form-field';

@Component({
  selector: 'app-element',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './element.component.html',
  styleUrl: './element.component.scss'
})

export class ElementComponent {

  @Input() formField!: DynamicFormField;

  @Output() outPutProperties = new EventEmitter<any>();
  showSelectOption: boolean = false
  showFileOption: boolean = false
  showCheckBoxOption: boolean = false
  showFileBoxOption: boolean = false
  showHiddenBox: boolean = false
  selectOptions!: SelectOptions;
  checkBoxOptions!: CheckBoxOptions;
  fileBoxOptions!: FileBoxOptions;
  newOption: any = {}
  optionSelIndex: number = -1;
  remoteSelect: boolean = false
  ngOnInit() {



    this.showSelectOption = false;
    let selectOptions;





    const type = this.formField.type

    switch (type) {
      case 'hiddenBox':
        this.showHiddenBox = true;
        this.formField.typeInput = 'hidden';
        break;
      case 'checkBox':
        this.showCheckBoxOption = true;
        this.formField.typeInput = 'boolean';

        this.checkBoxOptions = {
          haveLink: false,
          hrefLink: '',
          hrefText: ''
        }

        if (typeof this.formField.checkBoxOptions != 'undefined') {
          let checkBoxOptions = this.formField.checkBoxOptions
          this.checkBoxOptions = {
            haveLink: checkBoxOptions.haveLink,
            hrefLink: checkBoxOptions.hrefLink,
            hrefText: checkBoxOptions.hrefText

          }
        }

        this.formField.checkBoxOptions = this.checkBoxOptions
        break;
      case 'fileBox':

        this.showFileBoxOption = true;
        this.formField.typeInput = 'file'

        this.fileBoxOptions = {

          maxWidth: 0,
          maxheight: 0,
          isbase64: true,
          maxSize: 10
        }
        if (typeof this.formField.fileBoxOptions != 'undefined') {
          let fileBoxOptions = this.formField.fileBoxOptions
          this.fileBoxOptions = {

            maxWidth: fileBoxOptions.maxWidth,
            maxheight: fileBoxOptions.maxheight,
            isbase64: fileBoxOptions?.isbase64,
            maxSize: fileBoxOptions?.maxSize
          }
        }


        this.formField.fileBoxOptions = this.fileBoxOptions

        break;
      case 'selectBox':
        this.formField.typeInput = 'selectBox';

        this.showSelectOption = true;
        this.selectOptions = {
          multiple: false,
          displayExp: '',
          valueExp: '',
          options: [],
          parent: '',
          remote: false,
          api: ''
        }

        if (typeof this.formField.selectOptions != 'undefined') {
          selectOptions = this.formField.selectOptions
          this.selectOptions = {
            multiple: selectOptions.multiple,
            displayExp: selectOptions.displayExp,
            valueExp: selectOptions.valueExp,
            options: selectOptions.options,
            parent: selectOptions.parent,
            remote: selectOptions.remote,
            api: selectOptions.api

          }
        }

        this.formField.selectOptions = this.selectOptions
        break;

      default:
        break;
    }





  }
  // Funzione per aggiungere una nuova opzione all'array
  addOption() {
    if (this.formField.selectOptions!.remote) {
      return
    }
    
    let valueExp = this.formField.selectOptions!.valueExp
    let displayExp = this.formField.selectOptions!.displayExp

    if (!this.newOption[valueExp] || !this.newOption[displayExp]) {
      return
    }

    
    if (this.selectOptions?.options) {
      if (this.optionSelIndex >= 0) {
        this.selectOptions.options[this.optionSelIndex] = this.newOption;
      } else {
        this.selectOptions.options.push(this.newOption);
      }
    }


    // Resetta l'oggetto per la prossima nuova opzione

    if (this.formField.selectOptions)
      this.newOption = {
        [this.formField.selectOptions.valueExp]: '',
        [this.formField.selectOptions?.displayExp]: '',
        parent: ''
      }
    this.optionSelIndex = -1
  }
  // Funzione per selezionare l'opzione e modificare
  onOptionClick(option: any) {
    let valueExp = this.formField.selectOptions!.valueExp
    let displayExp = this.formField.selectOptions!.displayExp

    this.newOption = option
    if (this.formField.selectOptions?.options)
      this.optionSelIndex = this.formField.selectOptions?.options.findIndex(optionS => optionS == option)

    // Resetta l'oggetto per la prossima nuova opzione


  }

  // Funzione per rimuovere un'opzione dall'array
  removeOption(index: number) {
    if (this.selectOptions?.options) 
      this.selectOptions.options.splice(index, 1);
  }

  saveProperties(elementForm: NgForm) {

    const valid = this.formPrsValidate(elementForm)

    if (!valid) {
      return;
    }

    let outputEmit = {
      name: 'saveProperties',
      formField: this.formField
    }
    this.outPutProperties.emit(outputEmit);

  }

  closeProperties(elementForm: NgForm) {
    if (!elementForm.valid) {
      let outputEmit = {
        name: 'closeProperties',
        formField: this.formField
      }
      this.outPutProperties.emit(outputEmit);
    } else {
      confirm('Sei sicuro di voler abbandonare?', 'Attenzione!', (resp: boolean) => {
        if (resp) {

          let outputEmit = {
            name: 'closeProperties',
            formField: this.formField
          }
          this.outPutProperties.emit(outputEmit);
        }
      })
    }


    return;
    let outputEmit = {
      name: 'closeProperties',
      formField: this.formField
    }
    this.outPutProperties.emit(outputEmit);
  }

  addValidation(formElement: any) {
    formElement.validation.push({ type: '', value: '' });
  }

  formPrsValidate(elementForm: NgForm): boolean {

    if (!elementForm.valid) {
      alert('Mancano i campi obbligatori')
      this.markFormGroupTouched(elementForm);
      return false;

    }

    if (this.showSelectOption && this.formField.selectOptions && !this.formField.selectOptions.remote ) {
      if (this.formField.selectOptions.options?.length == 0) {
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
