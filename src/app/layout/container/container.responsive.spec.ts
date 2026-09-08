import { BreakpointObserver, Breakpoints, BreakpointState } from '@angular/cdk/layout';
import { signal, WritableSignal } from '@angular/core';
import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { HEADER_CONFIG } from '../../services/header-config';
import { HEADER_USER_PROVIDER } from '../../services/header-user-provider';
import { MenuService } from '../../services/menu.service';
import { OverlayService } from '../../services/overlay.service';
import { ContainerComponent } from './container.component';

describe('ContainerComponent E.5.0 responsive characterization', () => {
  let component: ContainerComponent;
  let fixture: ReturnType<typeof TestBed.createComponent<ContainerComponent>>;
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

  it('projects the current breakpoint policy into the shell mode classes', () => {
    emitBreakpoint(Breakpoints.XSmall);
    expect(fixture.nativeElement.querySelector('.mi-container').classList).toContain('menu-over');

    emitBreakpoint(Breakpoints.Small);
    expect(fixture.nativeElement.querySelector('.mi-container').classList).toContain('menu-over');

    emitBreakpoint(Breakpoints.Medium);
    expect(fixture.nativeElement.querySelector('.mi-container').classList).toContain('menu-side');

    emitBreakpoint(Breakpoints.Large);
    expect(fixture.nativeElement.querySelector('.mi-container').classList).toContain('menu-push');
  });

  it('keeps the authenticated Small shell mounted but closed and without a backdrop', fakeAsync(() => {
    currentUser.set({ uid: 'user-1' });
    flushMicrotasks();
    emitBreakpoint(Breakpoints.Small);

    const menuShell = fixture.nativeElement.querySelector('.verticalMenucontainer');

    expect(menuShell).toBeTruthy();
    expect(menuShell.classList).not.toContain('open');
    expect(fixture.nativeElement.querySelector('.menu-backdrop')).toBeNull();
  }));

  it('renders the open state and backdrop when an authenticated over-menu is explicitly opened', fakeAsync(() => {
    currentUser.set({ uid: 'user-1' });
    flushMicrotasks();
    emitBreakpoint(Breakpoints.XSmall);

    menuService.openMenu();
    fixture.detectChanges();

    const menuShell = fixture.nativeElement.querySelector('.verticalMenucontainer');

    expect(menuShell.classList).toContain('open');
    expect(fixture.nativeElement.querySelector('.menu-backdrop')).toBeTruthy();
  }));

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
    expect(fixture.nativeElement.querySelector('.mi-container').classList).toContain('menu-push');
  });
});
