import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { GridDataProvider, GridLoadRequest, GridPage } from '../../components/data-grid/data-grid-provider';
import { UserProfile } from '../../interface/app.interface';
import { UserRole, UserService } from '../../services/user.service';
import { environment } from '../../../environments/environment';

export type UserRemoteGridRow = UserProfile & {
  role?: UserRole;
  emailVerified?: boolean;
  disabled?: boolean;
  createdAt?: string | number | null;
  lastSignInTime?: string | null;
};

/**
 * Concrete adapter between the reusable DataGrid contract and the ComeMiVesto
 * administrative user APIs.
 *
 * This is intentionally the only layer in the new area that knows the HTTP
 * endpoint. `DataGridComponent` and `DataGridEngine` receive only semantic
 * `GridLoadRequest` objects and remain completely unaware of Firebase/API
 * details.
 */
@Injectable({ providedIn: 'root' })
export class UserGridProvider implements GridDataProvider<UserRemoteGridRow> {
  private readonly http = inject(HttpClient);
  private readonly users = inject(UserService);
  private readonly base = environment.apiBaseUrl;

  /**
   * Sends the normalized grid request to the dedicated backoffice endpoint.
   * The continuation token is treated as opaque by the Admin application.
   */
  load(request: GridLoadRequest): Promise<GridPage<UserRemoteGridRow>> {
    return firstValueFrom(
      this.http.post<GridPage<UserRemoteGridRow>>(`${this.base}/admin/users/grid`, request)
    );
  }

  /**
   * Creates an account through the existing admin-user API. The grid performs
   * an authoritative reload afterwards, so the returned object only represents
   * the mutation result and is not used as an optimistic local row.
   */
  async create(data: Partial<UserRemoteGridRow>): Promise<UserRemoteGridRow> {
    if (!data.email) throw new Error('Email is required');

    const created = await firstValueFrom(this.users.createAdminUser({
      email: data.email,
      displayName: data.displayName || undefined,
      nome: data.nome || undefined,
      cognome: data.cognome || undefined,
      gender: data.gender || undefined,
      role: data.role || 'creator',
    }));

    return {
      ...data,
      ...created,
      emailVerified: false,
      disabled: false,
    } as UserRemoteGridRow;
  }

  /**
   * Updates only the profile fields already supported by the existing user API.
   * Role/status management remains a distinct administrative action and is not
   * silently mixed into the generic DataGrid update contract.
   */
  async update(data: UserRemoteGridRow): Promise<UserRemoteGridRow> {
    if (!data.uid) throw new Error('User uid is required');
    const updated = await firstValueFrom(this.users.updateUserProfile(data.uid, data));
    return { ...data, ...updated };
  }

  /**
   * Deletes the complete user represented by the row. Identity interpretation
   * stays inside this provider; the DataGrid itself never assumes a `uid` field.
   */
  async delete(data: UserRemoteGridRow): Promise<void> {
    if (!data.uid) throw new Error('User uid is required');
    await firstValueFrom(this.users.deleteUser(data.uid));
  }
}
