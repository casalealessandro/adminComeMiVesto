export type PopupAction = 'added' | 'update' | 'remove' | 'setted';

export interface PopupInfo {
  id: string;
  componentName: string;
  dataToSend?: unknown;
  instancedData?: Record<string, unknown>;
  popUpWidth?: string | number;
  showCaptionFooter?: boolean;
  showCaptionHeader?: boolean;
  accessoringData?: unknown;
  title?: string;
  position?: string;
  isClosablePopUp?: boolean;
  class?: string;
  action?: PopupAction;
}

export interface PopupOutputEvent {
  guid?: string;
  name?: string;
  componentName?: string;
  accessoringData?: unknown;
  formData?: any;
  formField?: any;
  inEdit?: boolean;
  [key: string]: any;
}
