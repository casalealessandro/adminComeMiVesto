import { Injectable } from '@angular/core';
import { AuthService } from './services/auth.service';
import { LayoutSessionProvider } from './services/layout-session-provider';

@Injectable()
export class ComeMiVestoLayoutSessionService implements LayoutSessionProvider {

  constructor(private auth: AuthService) {}

  isAuthenticated(): boolean {
    return !!this.auth.currentUser();
  }

  waitForSession(): Promise<boolean> {
    return this.auth.waitForUser().then(user => !!user);
  }
}
