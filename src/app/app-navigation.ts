import { NavigationItem } from './services/navigation-registry';

export const comeMiVestoNavigation: readonly NavigationItem[] = [
  { path: 'dashboard', label: 'Dashboard', icon:'mdi mdi-view-dashboard-outline' },
  { path: 'utenti', label:'Utenti Registrati',icon:'mdi mdi-account-multiple-outline' },

  { path: 'form-list', label:'Gestione form e viste',icon:'mdi mdi-cog-outline' },
  { path: 'outfit-list', label:'Lista outfit ',icon:'mdi mdi-wardrobe-outline' },
  { path: 'outfit-category', label:'Lista categorie outfit ',icon:'mdi mdi-wardrobe-outline' },
  { path: 'colors', label:'Colori outfit',icon:'mdi mdi-palette-outline' },
  { path: 'reports', label:'Segnalazioni',icon:'mdi mdi-flag-outline' },
  { path: 'outfit-product-list', label:'Gestione prodotti e feed',icon:'mdi mdi-tshirt-v-outline' },
];
