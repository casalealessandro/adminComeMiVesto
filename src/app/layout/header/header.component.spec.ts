import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { HeaderComponent } from './header.component';
import { MenuService } from '../../services/menu.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { OverlayService } from '../../services/overlay.service';
import { UserProfile } from '../../interface/app.interface';
import { HEADER_CONFIG, HeaderConfig } from '../../services/header-config';

describe('HeaderComponent E.0 characterization', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let component: HeaderComponent;
  let menuService: MenuService;
  let userService: jasmine.SpyObj<UserService>;
  let auth: jasmine.SpyObj<AuthService>;
  let overlayService: jasmine.SpyObj<OverlayService>;

  const headerConfig: HeaderConfig = {
    logoUrl: 'assets/images/test-logo.jpg',
    logoAlt: 'Test logo',
    defaultAvatarUrl: 'assets/images/default-avatar.svg'
  };

  const profile = {
    nome: 'Mario',
    cognome: 'Rossi',
    displayName: 'Mario Rossi',
    photoURL: 'avatar.jpg'
  } as UserProfile;

  beforeEach(async () => {
    userService = jasmine.createSpyObj<UserService>('UserService', ['getUserProfile']);
    userService.getUserProfile.and.returnValue(of(profile) as any);

    auth = jasmine.createSpyObj<AuthService>('AuthService', ['currentUser', 'logout']);
    auth.currentUser.and.returnValue({ uid: 'user-1' } as any);
    auth.logout.and.returnValue(Promise.resolve() as any);

    overlayService = jasmine.createSpyObj<OverlayService>('OverlayService', ['openOverlay', 'closeOverlay']);

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        MenuService,
        provideRouter([]),
        { provide: UserService, useValue: userService },
        { provide: AuthService, useValue: auth },
        { provide: OverlayService, useValue: overlayService },
        { provide: HEADER_CONFIG, useValue: headerConfig }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    menuService = TestBed.inject(MenuService);
    fixture.detectChanges();
  });

  it('loads the current user profile during initialization', () => {
    expect(userService.getUserProfile).toHaveBeenCalledWith('user-1');
    expect(component.userProfile).toBe(profile);
  });

  it('does not request a profile when there is no authenticated user', () => {
    userService.getUserProfile.calls.reset();
    auth.currentUser.and.returnValue(null as any);

    component.renderHeader();

    expect(userService.getUserProfile).not.toHaveBeenCalled();
  });

  it('uses the configured logo and default avatar', () => {
    component.userProfile = { ...profile, photoURL: undefined } as UserProfile;
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

  it('delegates logout to AuthService', async () => {
    await component.logout();

    expect(auth.logout).toHaveBeenCalled();
  });
});
