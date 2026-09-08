import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BreakpointObserver } from '@angular/cdk/layout';
import { provideRouter } from '@angular/router';
import { MenuComponent } from './menu.component';
import { MenuService } from '../../services/menu.service';

describe('MenuComponent E.0 characterization', () => {
  let component: MenuComponent;
  let fixture: ComponentFixture<MenuComponent>;
  let menuService: MenuService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuComponent],
      providers: [
        MenuService,
        provideRouter([]),
        { provide: BreakpointObserver, useValue: {} }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MenuComponent);
    component = fixture.componentInstance;
    menuService = TestBed.inject(MenuService);
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

  it('reflects MenuService observable state locally', () => {
    expect(component.isMenuOpen).toBeFalse();

    menuService.openMenu();
    expect(component.isMenuOpen).toBeTrue();

    menuService.closeMenu();
    expect(component.isMenuOpen).toBeFalse();
  });

  it('closes the shared menu state when a navigation item is selected', () => {
    menuService.openMenu();
    spyOn(menuService, 'closeMenu').and.callThrough();

    component.navigateTo('dashboard');

    expect(menuService.closeMenu).toHaveBeenCalled();
    expect(menuService.isOpenMenu()).toBeFalse();
  });
});
