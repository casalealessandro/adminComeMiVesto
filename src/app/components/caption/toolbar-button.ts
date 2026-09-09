export interface ToolbarButton {
  id: string;
  name: string;
  text: string;
  icon?: string;
  disabled: boolean;
  visible: boolean;
  cssClass?: string;
  widget: 'button' | 'textBox';
  width?: number;
  position?: 'left' | 'right' | 'center';
}
