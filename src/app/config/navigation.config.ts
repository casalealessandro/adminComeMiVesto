import { AdminNavigationItem } from '../core/navigation/admin-navigation';

export const APP_NAVIGATION_ITEMS: readonly AdminNavigationItem[] = [
  { path: 'dashboard', label: 'Dashboard', icon: 'mdi mdi-view-dashboard-outline' },
  { path: 'utenti', label: 'Utenti registrati', icon: 'mdi mdi-account-multiple-outline' },
  { path: 'form-list', label: 'Gestione form e viste', icon: 'mdi mdi-cog-outline' },
  { path: 'outfit-list', label: 'Lista outfit', icon: 'mdi mdi-wardrobe-outline' },
  { path: 'outfit-category', label: 'Categorie outfit', icon: 'mdi mdi-wardrobe-outline' },
  { path: 'colors', label: 'Colori outfit', icon: 'mdi mdi-palette-outline' },
  { path: 'reports', label: 'Segnalazioni', icon: 'mdi mdi-flag-outline' },
  { path: 'outfit-product-list', label: 'Catalogo prodotti', icon: 'mdi mdi-tshirt-v-outline' }
];
