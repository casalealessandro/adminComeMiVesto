import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { GridDataProvider, GridLoadRequest, GridPage } from '../../core/data-grid/data-grid-provider';
import { UserProfile } from '../../interface/app.interface';

@Injectable({ providedIn: 'root' })
export class UsersGridProvider implements GridDataProvider<UserProfile> {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  load(request: GridLoadRequest): Promise<GridPage<UserProfile>> {
    return firstValueFrom(
      this.http.post<GridPage<UserProfile>>(`${this.base}/admin/users/grid`, request)
    );
  }
}
