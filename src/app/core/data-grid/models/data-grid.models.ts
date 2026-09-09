import { SelectOptions } from '../../forms/models/dynamic-form-field';

export interface detailOptions {
  groupDataField: string;
  costantValue?: costantValue[]
  isRemote: boolean;
  service: string;
  api: string;
  isEditable: boolean;
  queryString: string;
  colonne?:
  {
    dataField: string;
    dataType?: string;
    caption: string;
    allowEditing?: boolean,
    colVisible?: boolean,
    colWidth: number | any
  }[]
}

export interface costantValue {
  key: string;
  value: any;
}

export interface Colonne {
  groupDataField: string;
  caption?: string;
  colSpan?: number;
  itemType: string;
  class?: string;
  data: ColData[];
}[]

export interface ColData {
  labelAlignment?: any;
  edit: any;
  groupDataField: any;
  id?: any;
  colCaption: any;
  allowFiltering?: any;
  dataField: string;
  type: 'campoHidden' | 'campo' | 'campoNumber' | 'campoTesto' | 'campoDateTime' | 'campoData' | 'campoImg' | 'icon' | 'campoBoolean' | 'campoLista' | 'selection' | 'editorButtons' | 'campoButton' | 'removeButtons' | 'detail' | 'campoDesc' | 'empty';
  caption?: string;
  isEditable?: boolean;
  colWidth?: number | string;
  width?: number | string;
  class?: string | null;
  colSpan?: number;
  colAlignment?: string;
  search?: boolean;
  format?: string;
  booleanOptions?: {
    trueText?: string;
    falseText?: string;
  };
  editorType?: string;
  dynamic?: DynamicOptions;
  lista?: SelectOptions;
  allowEditing?: boolean;
  groupIndex?: number;
  showInSummary?: boolean;
  validation?: ValidationRule[];
  min?: number;
  max?: number;
  maxLength?: number;
  colVisible?: boolean;
  button?: any;
  customizedOptions?: any;
  tabIndex?: number;
  editorbuttons?: button[];
}

interface DynamicOptions {
  queryString?: string;
}

export interface button {
  id: any;
  nameEvent: string;
  text: string;
  icon: string;
  disabled: boolean;
  visible: boolean;
  cssClass: null,
  widget: 'button' | 'textBox' | 'selectBox',
  position: 'left'
}

interface ValidationRule {
  type: string;
  message?: string;
}
