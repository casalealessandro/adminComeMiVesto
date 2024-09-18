export interface DynamicFormField {

    name: string; // Nome del campo
    type: 'textBox' | 'textArea' | 'selectBox' | 'fileBox' | 'checkBox'; //  Tipo di elemento nella form
    typeInput:string; //Tipo del campo (es. 'text', 'number', 'email', etc.)
    label: string; // Etichetta del campo
    required?: boolean; // Se il campo è obbligatorio o meno
    minlength?: number; // Lunghezza minima per il campo
    maxlength?: number; // Lunghezza massima per il campo
    placeholder?: string; // Lunghezza massima per il campo
    cssClass: any;
    htmlId: any;
    maxLength: any;
    min: any;
    max: any;
    selectOptions?: SelectOptions;
    checkBoxOptions?: CheckBoxOptions;
    funcButton?:boolean

}

export interface CheckBoxOptions {
  haveLink: boolean;
  hrefLink: any;
  hrefText: string;
  
 
}

export interface SelectOptions {
    displayExp: string;
    valueExp: string;
    options: any[];
    multiple: boolean;
    parent: string;
  }

  interface Option {
    id: string;
    value: string;
    parent: string | null;
  }