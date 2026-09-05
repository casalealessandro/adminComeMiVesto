import { SelectOptions } from './dynamic-form-field';

export interface Colonne {
  groupDataField?: string;
  caption?: string;
  colSpan?: number;
  itemType: string;
  class?: string;
  data: ColData[];
}

export type GridColumnType =
  | 'campoHidden'
  | 'campo'
  | 'campoNumber'
  | 'campoTesto'
  | 'campoDateTime'
  | 'campoData'
  | 'campoImg'
  | 'icon'
  | 'campoBoolean'
  | 'campoLista'
  | 'selection'
  | 'editorButtons'
  | 'campoButton'
  | 'removeButtons'
  | 'detail'
  | 'campoDesc'
  | 'empty';

export interface ColData {
  dataField: string;
  type: GridColumnType;
  caption?: string;
  colCaption?: string;
  colVisible?: boolean;
  colWidth?: number | string;
  width?: number | string;
  class?: string | null;
  colSpan?: number;
  colAlignment?: string;
  allowEditing?: boolean;
  allowFiltering?: boolean;
  isEditable?: boolean;
  format?: string;
  editorType?: string;
  lista?: SelectOptions;
  button?: any;
  validation?: Array<{ type: string; message?: string }>;
  min?: number;
  max?: number;
  maxLength?: number;
  labelAlignment?: unknown;
  edit?: unknown;
  groupDataField?: unknown;
  groupIndex?: number;
  showInSummary?: boolean;
  search?: boolean;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  cognome: string;
  name: string;
  nome?: string;
  email: string;
  photoURL?: string;
  bio?: string;
  userType?: unknown;
  createAt: number;
  createdAt?: string | number;
  lastSignInTime?: string;
  emailVerified?: boolean;
  disabled?: boolean;
  role?: 'admin' | 'editor' | 'creator';
  gender?: string;
}
