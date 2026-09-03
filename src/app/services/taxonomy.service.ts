import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface OutfitColor { id: string; value: string; hex: string; parent: string | null; }
@Injectable({ providedIn: 'root' })
export class TaxonomyService {
  private http = inject(HttpClient); private base = `${environment.apiBaseUrl}/gen`;
  getColors(): Observable<OutfitColor[]> { return this.http.get<any>(`${this.base}/outfitColors`).pipe(map(value => Array.isArray(value) ? value : value.data || [])); }
  createColor(color: OutfitColor): Observable<unknown> { return this.http.post(`${this.base}/outfitColors`, color); }
  updateColor(id: string, color: Omit<OutfitColor, 'id'>): Observable<unknown> { return this.http.put(`${this.base}/outfitColors/${encodeURIComponent(id)}`, { value: color.value, hex: color.hex, parent: color.parent }); }
  deleteColor(id: string): Observable<unknown> { return this.http.delete(`${this.base}/outfitColors/${encodeURIComponent(id)}`); }
}
