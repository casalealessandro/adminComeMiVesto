import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from './services/auth.service';
describe('authGuard', () => {
  it('clears Firebase session when role endpoint returns 401', async () => {
    const auth = jasmine.createSpyObj('AuthService', ['waitForUser', 'refreshRole', 'logout']);
    auth.waitForUser.and.resolveTo({ uid: 'uid' });
    auth.refreshRole.and.rejectWith(new HttpErrorResponse({ status: 401 }));
    auth.logout.and.returnValue(Promise.resolve());
    const urlTree = {};
    const router = jasmine.createSpyObj('Router', ['createUrlTree']);
    router.createUrlTree.and.returnValue(urlTree);
    TestBed.configureTestingModule({ providers: [{ provide: AuthService, useValue: auth }, { provide: Router, useValue: router }] });
    const result = await TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
    expect(auth.logout).toHaveBeenCalledWith(false);
    expect(result).toBe(urlTree);
  });
});
