import { ComponentFixture, fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { BreakpointObserver, Breakpoints, BreakpointState } from '@angular/cdk/layout';
import { provideRouter } from '@angular/router';
import { signal, WritableSignal } from '@angular/core';
import { of, Subject } from 'rxjs';
import { ContainerComponent } from './container.component';
import { MenuService } from '../../services/menu.service';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { OverlayService } from '../../services/overlay.service';

describe('ContainerComponent E.0 characterization', () => {
  let fixture: ComponentFixture<ContainerComponent>;
  let component: ContainerComponent;
  let menuService: MenuService;
  let breakpointState$: Subject<BreakpointState>;
  let currentUser: WritableSignal<any>;

  beforeEach(async () => {
    breakpointState$ = new Subject<BreakpointState>();
    currentUser = signal<any>(null);

    await TestBed.configureTestingModule({
      imports: [ContainerComponent],
      providers: [
        MenuService,
        provideRouter([]),
        {
          provide: BreakpointObserver,
          useValue: {
            observe: jasmine.createSpy('observe').and.returnValue(breakpointState$.asObservable())
          }
        },
        {
          provide: AuthService,
          useValue: {
            currentUser,
            waitForUser: jasmine.createSpy('waitForUser').and.callFake(() => Promise.resolve(currentUser())),
            logout: jasmine.createSpy('logout').and.returnValue(Promise.resolve())
          }
        },
        {
          provide: UserService,
          useValue: {
            getUserProfile: jasmine.createSpy('getUserProfile').and.returnValue(of({}))
          }
        },
        {
          provide: OverlayService,
          useValue: {
            openOverlay: jasmine.createSpy('openOverlay'),
            closeOverlay: jasmine.createSpy('closeOverlay')
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ContainerComponent);
    component = fixture.componentInstance;
    menuService = TestBed.inject(MenuService);
    fixture.detectChanges();
  });

  function emitBreakpoint(active: string) {
    breakpointState$.next({
      matches: true,
      breakpoints: {
        [Breakpoints.XSmall]: active === Breakpoints.XSmall,
        [Breakpoints.Small]: active === Breakpoints.Small,
        [Breakpoints.Medium]: active === Breakpoints.Medium,
        [Breakpoints.Large]: active === Breakpoints.Large
      }
    });
  }

  it('uses over mode and closes the menu on XSmall screens', () => {
    menuService.openMenu();

    emitBreakpoint(Breakpoints.XSmall);

    expect(component.mode).toBe('over');
    expect(menuService.isOpenMenu()).toBeFalse();
  });

  it('uses over mode and closes the menu on Small screens', () => {
    menuService.openMenu();

    emitBreakpoint(Breakpoints.Small);

    expect(component.mode).toBe('over');
    expect(menuService.isOpenMenu()).toBeFalse();
  });

  it('uses side mode and opens the menu on Medium screens', () => {
    menuService.closeMenu();

    emitBreakpoint(Breakpoints.Medium);

    expect(component.mode).toBe('side');
    expect(menuService.isOpenMenu()).toBeTrue();
  });

  it('uses push mode and opens the menu on Large screens', () => {
    menuService.closeMenu();

    emitBreakpoint(Breakpoints.Large);

    expect(component.mode).toBe('push');
    expect(menuService.isOpenMenu()).toBeTrue();
  });

  it('renders the mobile backdrop only for an authenticated open over-menu', fakeAsync(() => {
    currentUser.set({ uid: 'user-1' });
    flushMicrotasks();
    emitBreakpoint(Breakpoints.XSmall);
    menuService.openMenu();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.menu-backdrop')).toBeTruthy();

    menuService.closeMenu();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.menu-backdrop')).toBeNull();
  }));

  it('delegates header/menu toggle behavior to MenuService', () => {
    menuService.closeMenu();

    component.toggleMenu(null);
    expect(menuService.isOpenMenu()).toBeTrue();

    component.closeMenu();
    expect(menuService.isOpenMenu()).toBeFalse();
  });
});
