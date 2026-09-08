import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { HeaderComponent } from './header.component';
import { MenuService } from '../../services/menu.service';
import { OverlayService } from '../../services/overlay.service';
import { HEADER_CONFIG, HeaderConfig } from '../../services/header-config';
import { HEADER_USER_PROVIDER, HeaderUser, HeaderUserProvider } from '../../services/header-user-provider';

describe('HeaderComponent E.3.3 cleanup', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let component: HeaderComponent;
  let menuService: MenuService;
  let overlayService: jasmine.SpyObj<OverlayService>;
  let headerUserProvider: jasmine.SpyObj<HeaderUserProvider>;

  const headerConfig: HeaderConfig = {
    logoUrl: 'assets/images/test-logo.jpg',
    logoAlt: 'Test logo',
    defaultAvatarUrl: 'assets/images/default-avatar.svg'
  };

  const profile: HeaderUser = {
    displayName: 'Mario Rossi',
    profileLabel: 'Mario Rossi',
    photoURL: 'avatar.jpg'
  };

  beforeEach(async () => {
    headerUserProvider = jasmine.createSpyObj<HeaderUserProvider>('HeaderUserProvider', ['getUser', 'logout']);
    headerUserProvider.getUser.and.returnValue(of(profile));
    headerUserProvider.logout.and.returnValue(Promise.resolve());

    overlayService = jasmine.createSpyObj<OverlayService>('OverlayService', ['openOverlay', 'closeOverlay']);

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        MenuService,
        { provide: OverlayService, useValue: overlayService },
        { provide: HEADER_CONFIG, useValue: headerConfig },
        { provide: HEADER_USER_PROVIDER, useValue: headerUserProvider }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    menuService = TestBed.inject(MenuService);
    fixture.detectChanges();
  });

  it('loads the current header user during initialization', () => {
    expect(headerUserProvider.getUser).toHaveBeenCalled();
    expect(component.userProfile).toBe(profile);
  });

  it('keeps the header user empty when the provider has no current user', () => {
    headerUserProvider.getUser.and.returnValue(of(null));
    component.userProfile = undefined;

    component.renderHeader();

    expect(component.userProfile).toBeUndefined();
  });

  it('uses the configured logo and default avatar', () => {
    component.userProfile = { ...profile, photoURL: undefined };
    fixture.detectChanges();

    const logo = fixture.nativeElement.querySelector('.logo-image') as HTMLImageElement;
    const avatar = fixture.nativeElement.querySelector('.profile-img') as HTMLImageElement;

    expect(logo.getAttribute('src')).toBe(headerConfig.logoUrl);
    expect(logo.getAttribute('alt')).toBe(headerConfig.logoAlt);
    expect(avatar.getAttribute('src')).toBe(headerConfig.defaultAvatarUrl);
  });

  it('toggles the shared menu state from the hamburger action', () => {
    menuService.closeMenu();

    component.onToggleMenu();
    expect(menuService.isOpenMenu()).toBeTrue();

    component.onToggleMenu();
    expect(menuService.isOpenMenu()).toBeFalse();
  });

  it('opens the profile overlay with the current template and without backdrop', () => {
    const button = document.createElement('button');
    spyOn(button, 'getBoundingClientRect').and.returnValue({
      top: 10,
      bottom: 50,
      left: 20,
      right: 60,
      width: 40,
      height: 40,
      x: 20,
      y: 10,
      toJSON: () => ({})
    } as DOMRect);

    const event = {
      currentTarget: button,
      stopPropagation: jasmine.createSpy('stopPropagation')
    };

    component.toggleDropDown(event);

    expect(event.stopPropagation).toHaveBeenCalled();
    expect(overlayService.openOverlay).toHaveBeenCalledWith(jasmine.objectContaining({
      contentTemplate: component.dynamicContent,
      showBgOverlay: false,
      index: 0
    }));
  });

  it('delegates logout to the header user provider', async () => {
    await component.logout();

    expect(headerUserProvider.logout).toHaveBeenCalled();
  });
});
