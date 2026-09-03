import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import firebase from 'firebase/compat/app';
import { environment } from '../../environments/environment';

export type BackofficeRole = 'admin' | 'editor' | 'creator';
export interface RoleResponse { uid: string; role: BackofficeRole; canAccessBackoffice: boolean; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly firebaseAuth = inject(AngularFireAuth);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  readonly currentUser = signal<firebase.User | null>(null);
  readonly role = signal<BackofficeRole | null>(null);
  readonly canAccessBackoffice = signal(false);
  readonly isAdmin = computed(() => this.role() === 'admin');
  private authReady?: Promise<firebase.User | null>;
  private logoutRunning = false;

  waitForUser(): Promise<firebase.User | null> {
    if (!this.authReady) {
      this.authReady = firstValueFrom(this.firebaseAuth.authState).then(user => {
        this.currentUser.set(user);
        return user;
      });
    }
    return this.authReady;
  }

  async login(email: string, password: string): Promise<RoleResponse> {
    const credential = await this.firebaseAuth.signInWithEmailAndPassword(email, password);
    this.currentUser.set(credential.user);
    this.authReady = Promise.resolve(credential.user);
    try { return await this.refreshRole(); }
    catch (error) { await this.logout(false); throw error; }
  }

  async refreshRole(): Promise<RoleResponse> {
    const response = await firstValueFrom(this.http.get<RoleResponse>(`${environment.apiBaseUrl}/user/me/role`));
    this.role.set(response.role);
    this.canAccessBackoffice.set(response.canAccessBackoffice && (response.role === 'admin' || response.role === 'editor'));
    return response;
  }

  async getIdToken(): Promise<string | null> {
    const user = this.currentUser() || await this.waitForUser();
    return user ? user.getIdToken() : null;
  }

  clear(): void {
    this.currentUser.set(null);
    this.role.set(null);
    this.canAccessBackoffice.set(false);
    this.authReady = undefined;
  }

  async logout(redirect = true): Promise<void> {
    if (this.logoutRunning) return;
    this.logoutRunning = true;
    try { await this.firebaseAuth.signOut(); } finally {
      this.clear();
      this.logoutRunning = false;
      if (redirect) await this.router.navigate(['/login']);
    }
  }

  async handleUnauthorized(): Promise<void> { await this.logout(true); }
}
