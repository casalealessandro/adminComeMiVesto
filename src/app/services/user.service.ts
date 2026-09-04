import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { UserProfile } from '../interface/app.interface';

export type UserRole = 'admin' | 'editor' | 'creator';
export interface UsersPage { data: UserProfile[]; nextPageToken: string | null; }
export type UserProfileUpdate = Pick<UserProfile, 'displayName' | 'nome' | 'cognome' | 'bio' | 'photoURL' | 'gender'>;
export interface AdminCreateUserRequest {
  email: string;
  displayName?: string;
  nome?: string;
  cognome?: string;
  gender?: string;
  role: UserRole;
}
export interface AdminCreateUserResponse extends AdminCreateUserRequest {
  uid: string;
  passwordSetupEmailSent: boolean;
}
interface AdminCreateUserEnvelope { message: string; data: AdminCreateUserResponse; }

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  /** Compatibility for unused legacy layout widgets; authentication state lives in AuthService. */
  get InfoUtenteConnesso(): any { return {}; }

  getUsersPage(limit = 50, pageToken?: string): Observable<UsersPage> {
    let params = new HttpParams().set('limit', limit);
    if (pageToken) params = params.set('pageToken', pageToken);
    return this.http.get<UsersPage>(`${this.base}/user/users`, { params }).pipe(
      map(response => ({ data: response.data || [], nextPageToken: response.nextPageToken || null }))
    );
  }

  getUsers(limit = 50, pageToken?: string): Observable<UserProfile[]> {
    return this.getUsersPage(limit, pageToken).pipe(map(response => response.data));
  }

  getUserProfile(uid: string): Observable<UserProfile> {
    return this.http.get<any>(`${this.base}/user/user-profile/${encodeURIComponent(uid)}`).pipe(
      map(response => response.data || response)
    );
  }

  updateUserProfile(uid: string, value: Partial<UserProfileUpdate>): Observable<UserProfile> {
    const body: Partial<UserProfileUpdate> = {};
    const editable: (keyof UserProfileUpdate)[] = ['displayName', 'nome', 'cognome', 'bio', 'photoURL', 'gender'];
    editable.forEach(key => { if (value[key] !== undefined) (body as any)[key] = value[key]; });
    return this.http.put<UserProfile>(`${this.base}/user/update-user-profile/${encodeURIComponent(uid)}`, body);
  }

  enableUser(uid: string): Observable<unknown> { return this.http.post(`${this.base}/user/enable/${encodeURIComponent(uid)}`, {}); }
  disableUser(uid: string): Observable<unknown> { return this.http.post(`${this.base}/user/disable/${encodeURIComponent(uid)}`, {}); }
  resetPassword(uid: string): Observable<unknown> { return this.http.post(`${this.base}/user/password-reset/${encodeURIComponent(uid)}`, {}); }
  deleteUser(uid: string): Observable<unknown> { return this.http.delete(`${this.base}/user/delete/${encodeURIComponent(uid)}`); }
  updateRole(uid: string, role: UserRole): Observable<unknown> {
    return this.http.put(`${this.base}/admin/users/${encodeURIComponent(uid)}/role`, { role });
  }

  createAdminUser(payload: AdminCreateUserRequest): Observable<AdminCreateUserResponse> {
    return this.http.post<AdminCreateUserEnvelope>(`${this.base}/admin/users`, payload).pipe(
      map(response => response.data)
    );
  }
}
