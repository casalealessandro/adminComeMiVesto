import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';
import { GridDataProvider, GridLoadRequest, GridPage } from '../../components/data-grid/data-grid-provider';
import { outfit } from '../../services/outfit.service';

/** Backoffice-only provider: search, filters, order and paging are all server-side. */
@Injectable({ providedIn: 'root' })
export class OutfitsGridProvider implements GridDataProvider<outfit> {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  load(request: GridLoadRequest): Promise<GridPage<outfit>> {
    return firstValueFrom(this.http.post<GridPage<outfit>>(`${this.base}/admin/outfits/grid`, request));
  }

  deleteMany(rows: outfit[]): Promise<void> {
    return firstValueFrom(this.http.post<void>(`${this.base}/admin/outfits/bulk-delete`, {
      ids: rows.map(row => String(row.id))
    }));
  }
}
