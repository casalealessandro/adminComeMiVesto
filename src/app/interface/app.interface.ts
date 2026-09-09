export { detailOptions, costantValue, Colonne, ColData, button } from '../core/data-grid/models/data-grid.models';
export { ToolbarButton } from '../core/ui/caption/toolbar-button';

export interface Utente {
  uid: string;
  displayName: string;
  cognome: string;
  name: string;
  nome?: string;
  email: string;
  photoURL?: string;
  bio?: string;
  userType?: any
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
  userType?: any;
  createAt: number;
  createdAt?: string | number;
  lastSignInTime?: string;
  emailVerified?: boolean;
  disabled?: boolean;
  role?: 'admin' | 'editor' | 'creator';
  gender?: string;
}
