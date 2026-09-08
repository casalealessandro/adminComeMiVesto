import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { MenuComponent } from './menu.component';
import { MenuService } from '../../services/menu.service';

@Component({
  standalone: true,
  template: ''
})
class TestRouteComponent {}

describe('MenuComponent E.1 correctness', () => {
  let component: MenuComponent;
  let fixture: ComponentFixture<MenuComponent>;
  let menuService: MenuService;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuComponent],
      providers: [
        MenuService,
        provideRouter([
          { path: 'dashboard', component: TestRouteComponent }
        ])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MenuComponent);
    component = fixture.componentInstance;
    menuService = TestBed.inject(MenuService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('keeps the current ComeMiVesto navigation entries and order', () => {
    expect(component.allMenu).toEqual([
      { path: 'dashboard', label: 'Dashboard', icon: 'mdi mdi-view-dashboard-outline' },
      { path: 'utenti', label: 'Utenti Registrati', icon: 'mdi mdi-account-multiple-outline' },
      { path: 'form-list', label: 'Gestione form e viste', icon: 'mdi mdi-cog-outline' },
      { path: 'outfit-list', label: 'Lista outfit ', icon: 'mdi mdi-wardrobe-outline' },
      { path: 'outfit-category', label: 'Lista categorie outfit ', icon: 'mdi mdi-wardrobe-outline' },
      { path: 'colors', label: 'Colori outfit', icon: 'mdi mdi-palette-outline' },
      { path: 'reports', label: 'Segnalazioni', icon: 'mdi mdi-flag-outline' },
      { path: 'outfit-product-list', label: 'Gestione prodotti e feed', icon: 'mdi mdi-tshirt-v-outline' }
    ]);
  });

  it('renders one navigation link for each configured menu entry', () => {
    const links = Array.from(fixture.nativeElement.querySelectorAll('a.nav-link')) as HTMLAnchorElement[];

    expect(links.length).toBe(component.allMenu.length);
    expect(links.map(link => link.getAttribute('aria-label')))
      .toEqual(component.allMenu.map(item => item.label));
  });

  it('reads the shared menu state directly from the readonly signal', () => {
    expect(component.getIsMenuOpen()).toBeFalse();

    menuService.openMenu();
    expect(component.getIsMenuOpen()).toBeTrue();

    menuService.closeMenu();
    expect(component.getIsMenuOpen()).toBeFalse();
  });

  it('closes the shared menu state when a navigation item is selected', () => {
    menuService.openMenu();
    spyOn(menuService, 'closeMenu').and.callThrough();

    component.navigateTo('dashboard');

    expect(menuService.closeMenu).toHaveBeenCalled();
    expect(menuService.isOpenMenu()).toBeFalse();
  });

  it('sets aria-current only on the active route', async () => {
    await router.navigateByUrl('/dashboard');
    await fixture.whenStable();
    fixture.detectChanges();

    const links = Array.from(fixture.nativeElement.querySelectorAll('a.nav-link')) as HTMLAnchorElement[];

    expect(links[0].getAttribute('aria-current')).toBe('page');
    links.slice(1).forEach(link => expect(link.getAttribute('aria-current')).toBeNull());
  });
});
