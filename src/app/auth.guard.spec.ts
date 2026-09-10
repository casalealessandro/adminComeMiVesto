import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from './services/auth.service';

describe('authGuard release readiness', () => {
  function setup(options: {
    user?: any;
    access?: { role: 'admin' | 'editor' | 'creator'; canAccessBackoffice: boolean };
    refreshError?: unknown;
  } = {}) {
    TestBed.resetTestingModule();

    const auth = jasmine.createSpyObj('AuthService', ['waitForUser', 'refreshRole', 'logout']);
    auth.waitForUser.and.resolveTo(options.user === undefined ? { uid: 'uid' } : options.user);
    if (options.refreshError) {
      auth.refreshRole.and.rejectWith(options.refreshError);
    } else {
      auth.refreshRole.and.resolveTo(options.access ?? { role: 'admin', canAccessBackoffice: true });
    }
    auth.logout.and.returnValue(Promise.resolve());

    const loginTree = { target: 'login' };
    const deniedTree = { target: 'access-denied' };
    const router = jasmine.createSpyObj('Router', ['createUrlTree']);
    router.createUrlTree.and.callFake((commands: string[]) =>
      commands[0] === '/access-denied' ? deniedTree : loginTree,
    );

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });

    return { auth, router, loginTree, deniedTree };
  }

  async function executeGuard(): Promise<unknown> {
    return TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
  }

  it('redirects anonymous users to login without calling the role endpoint', async () => {
    const { auth, loginTree } = setup({ user: null });

    const result = await executeGuard();

    expect(result).toBe(loginTree);
    expect(auth.refreshRole).not.toHaveBeenCalled();
  });

  it('allows administrators with backoffice access', async () => {
    setup({ access: { role: 'admin', canAccessBackoffice: true } });

    expect(await executeGuard()).toBeTrue();
  });

  it('allows editors with backoffice access', async () => {
    setup({ access: { role: 'editor', canAccessBackoffice: true } });

    expect(await executeGuard()).toBeTrue();
  });

  it('rejects creators even if the role payload claims backoffice access', async () => {
    const { deniedTree } = setup({ access: { role: 'creator', canAccessBackoffice: true } });

    expect(await executeGuard()).toBe(deniedTree);
  });

  it('rejects admin/editor roles when canAccessBackoffice is false', async () => {
    const adminSetup = setup({ access: { role: 'admin', canAccessBackoffice: false } });
    expect(await executeGuard()).toBe(adminSetup.deniedTree);

    const editorSetup = setup({ access: { role: 'editor', canAccessBackoffice: false } });
    expect(await executeGuard()).toBe(editorSetup.deniedTree);
  });

  it('clears Firebase session when role endpoint returns 401', async () => {
    const { auth, loginTree } = setup({
      refreshError: new HttpErrorResponse({ status: 401 }),
    });

    const result = await executeGuard();

    expect(auth.logout).toHaveBeenCalledWith(false);
    expect(result).toBe(loginTree);
  });
});
