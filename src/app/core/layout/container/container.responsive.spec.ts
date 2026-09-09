import { BreakpointObserver, Breakpoints, BreakpointState } from '@angular/cdk/layout';
import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';
import { HEADER_CONFIG } from '../contracts/header-config';
import { HEADER_USER_PROVIDER } from '../contracts/header-user-provider';
import { LAYOUT_SESSION_PROVIDER } from '../contracts/layout-session-provider';
import { MenuService } from '../menu/menu.service';
import { OverlayService } from '../../overlay/overlay.service';
import { ContainerComponent } from './container.component';

describe('ContainerComponent E.5.1 responsive regression', () => {
  let component: ContainerComponent;
  let fixture: ComponentFixture<ContainerComponent>;
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
          provide: LAYOUT_SESSION_PROVIDER,
          useValue: {
            isAuthenticated: () => !!currentUser(),
            waitForSession: jasmine.createSpy('waitForSession').and.callFake(() => Promise.resolve(!!currentUser()))
          }
        },
        {
          provide: HEADER_CONFIG,
          useValue: {
            logoUrl: 'assets/images/test-logo.jpg',
            logoAlt: 'Test logo',
            defaultAvatarUrl: 'assets/images/default-avatar.svg'
          }
        },
        {
          provide: HEADER_USER_PROVIDER,
          useValue: {
            getUser: jasmine.createSpy('getUser').and.returnValue(of(null)),
            logout: jasmine.createSpy('logout').and.returnValue(Promise.resolve())
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

  function emitBreakpoint(active: string | null) {
    breakpointState$.next({
      matches: active !== null,
      breakpoints: {
        [Breakpoints.XSmall]: active === Breakpoints.XSmall,
        [Breakpoints.Small]: active === Breakpoints.Small,
        [Breakpoints.Medium]: active === Breakpoints.Medium,
        [Breakpoints.Large]: active === Breakpoints.Large
      }
    });
    fixture.detectChanges();
  }

  it('projects the breakpoint policy into one shell mode class at a time', () => {
    const shell = () => fixture.nativeElement.querySelector('.mi-container').classList;

    emitBreakpoint(Breakpoints.XSmall);
    expect(shell().contains('menu-over')).toBeTrue();
    expect(shell().contains('menu-side')).toBeFalse();
    expect(shell().contains('menu-push')).toBeFalse();

    emitBreakpoint(Breakpoints.Small);
    expect(shell().contains('menu-over')).toBeTrue();
    expect(shell().contains('menu-side')).toBeFalse();
    expect(shell().contains('menu-push')).toBeFalse();

    emitBreakpoint(Breakpoints.Medium);
    expect(shell().contains('menu-over')).toBeFalse();
    expect(shell().contains('menu-side')).toBeTrue();
    expect(shell().contains('menu-push')).toBeFalse();

    emitBreakpoint(Breakpoints.Large);
    expect(shell().contains('menu-over')).toBeFalse();
    expect(shell().contains('menu-side')).toBeFalse();
    expect(shell().contains('menu-push')).toBeTrue();
  });

  it('keeps the authenticated Small shell mounted but closed and without a backdrop', fakeAsync(() => {
    currentUser.set({ uid: 'user-1' });
    flushMicrotasks();
    emitBreakpoint(Breakpoints.Small);

    const menuShell = fixture.nativeElement.querySelector('.verticalMenucontainer');

    expect(menuShell).toBeTruthy();
    expect(menuShell.classList.contains('open')).toBeFalse();
    expect(fixture.nativeElement.querySelector('.menu-backdrop')).toBeNull();
  }));

  it('opens the over shell and renders its backdrop through MenuService state', fakeAsync(() => {
    currentUser.set({ uid: 'user-1' });
    flushMicrotasks();
    emitBreakpoint(Breakpoints.Small);

    menuService.openMenu();
    fixture.detectChanges();

    const menuShell = fixture.nativeElement.querySelector('.verticalMenucontainer');

    expect(menuShell.classList.contains('open')).toBeTrue();
    expect(fixture.nativeElement.querySelector('.menu-backdrop')).toBeTruthy();
  }));

  it('keeps Medium in side mode with the menu opened by the breakpoint policy', () => {
    menuService.closeMenu();

    emitBreakpoint(Breakpoints.Medium);

    expect(component.mode).toBe('side');
    expect(menuService.isOpenMenu()).toBeTrue();
    expect(fixture.nativeElement.querySelector('.verticalMenucontainer').classList.contains('open')).toBeTrue();
  });

  it('preserves the historical 1024px initialization threshold', () => {
    menuService.closeMenu();

    component.updateMenuVisibility(1025);
    expect(menuService.isOpenMenu()).toBeTrue();

    component.updateMenuVisibility(1024);
    expect(menuService.isOpenMenu()).toBeFalse();
  });

  it('falls back to push mode with an open menu when none of the observed breakpoints matches', () => {
    menuService.closeMenu();

    emitBreakpoint(null);

    expect(component.mode).toBe('push');
    expect(menuService.isOpenMenu()).toBeTrue();
    expect(fixture.nativeElement.querySelector('.mi-container').classList.contains('menu-push')).toBeTrue();
  });
});
