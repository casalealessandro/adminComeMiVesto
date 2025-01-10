import { CanActivateFn, Router } from '@angular/router';
import { UserService } from './services/user.service';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const userService = inject(UserService);
  const ruter = inject(Router);
  return userService.isLoggedUser() ? true : ruter.navigate(['login']);
};
