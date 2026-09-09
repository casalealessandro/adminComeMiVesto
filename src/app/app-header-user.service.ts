import { Injectable } from '@angular/core';
import { map, Observable, of } from 'rxjs';
import { AuthService } from './services/auth.service';
import { HeaderUser, HeaderUserProvider } from './core/public-api';
import { UserService } from './services/user.service';

@Injectable()
export class ComeMiVestoHeaderUserService implements HeaderUserProvider {

  constructor(private auth: AuthService, private userService: UserService) {}

  getUser(): Observable<HeaderUser | null> {
    const user = this.auth.currentUser();
    if (!user) return of(null);

    return this.userService.getUserProfile(user.uid).pipe(
      map(userProfile => ({
        displayName: userProfile.displayName,
        profileLabel: `${userProfile.nome || ''} ${userProfile.cognome || ''}`.trim() || userProfile.displayName,
        photoURL: userProfile.photoURL
      }))
    );
  }

  logout(): Promise<void> {
    return this.auth.logout();
  }
}
