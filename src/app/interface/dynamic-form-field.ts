export interface DynamicFormField {

  
 
    htmlId?:any;
    name: string; // Nome del campo
    type: 'textBox' | 'textArea' | 'selectBox' | 'fileBox' | 'checkBox' | 'hiddenBox'; //  Tipo di elemento nella form
    typeInput:string; //Tipo del campo (es. 'text', 'number', 'email', etc.)
    label: string; // Etichetta del campo
    cssClass:string;
    required?: boolean; // Se il campo è obbligatorio o meno
    minlength?: number; // Lunghezza minima per il campo
    maxlength?: number; // Lunghezza massima per il campo
    placeholder?: string; // Lunghezza massima per il campo
    options?:any[];
    maxLength: any;
    min: any;
    max: any;
    selectOptions?: SelectOptions;
    checkBoxOptions?: CheckBoxOptions;
    fileBoxOptions?:FileBoxOptions
    funcButton?:boolean
}


export interface SelectOptions {
    displayExp: string;
    valueExp: string;
    options?: any[];
    multiple: boolean;
    remote:boolean;
    api?:string;
    parent: string | null;
  }

  interface Option {
    id: string;
    value: string;
    parent: string | null;
  }

  export interface FileBoxOptions {
    maxWidth: number;
    maxheight: number;
    isbase64: boolean;
    maxSize?:number;
    
   
  }

  export interface CheckBoxOptions {
    haveLink: boolean;
    hrefLink: string;
    hrefText: string;
    
   
  }