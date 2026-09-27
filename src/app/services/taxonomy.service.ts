import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface OutfitColor { id: string; value: string; hex: string; parent: string | null; }
export interface OutfitStyleImage { imageBase64: string; imageMimeType: string; imageFileName: string; }
export interface OutfitStyleImages { U?: OutfitStyleImage | null; D?: OutfitStyleImage | null; }
export interface OutfitStyle { id: string; value: string; parent: null; order: number; gender: Array<'U' | 'D'>; images?: OutfitStyleImages; }
export type OutfitStyleUpdate = Omit<OutfitStyle, 'id' | 'images'> & { images?: OutfitStyleImages };
@Injectable({ providedIn: 'root' })
export class TaxonomyService {
  private http = inject(HttpClient); private base = `${environment.apiBaseUrl}/gen`;
  getColors(): Observable<OutfitColor[]> { return this.http.get<any>(`${this.base}/outfitColors`).pipe(map(value => Array.isArray(value) ? value : value.data || [])); }
  createColor(color: OutfitColor): Observable<unknown> { return this.http.post(`${this.base}/outfitColors`, color); }
  updateColor(id: string, color: Omit<OutfitColor, 'id'>): Observable<unknown> { return this.http.put(`${this.base}/outfitColors/${encodeURIComponent(id)}`, { value: color.value, hex: color.hex, parent: color.parent }); }
  deleteColor(id: string): Observable<unknown> { return this.http.delete(`${this.base}/outfitColors/${encodeURIComponent(id)}`); }
  getStyles(): Observable<OutfitStyle[]> {
    return this.http.get<any>(`${this.base}/outfitStyles`).pipe(
      map(value => Array.isArray(value) ? value : value.data || []),
      map(styles => styles.map((style: any) => ({
        ...style,
        parent: style.parent ?? null,
        order: Number(style.order) || 0,
        gender: Array.isArray(style.gender)
          ? style.gender.filter((item: unknown): item is 'U' | 'D' => item === 'U' || item === 'D')
          : [],
        images: style.images && typeof style.images === 'object' ? style.images : undefined,
      })))
    );
  }
  createStyle(style: OutfitStyle): Observable<unknown> { return this.http.post(`${this.base}/outfitStyles`, style); }
  updateStyle(id: string, style: OutfitStyleUpdate): Observable<unknown> { return this.http.put(`${this.base}/outfitStyles/${encodeURIComponent(id)}`, style); }
  deleteStyle(id: string): Observable<unknown> { return this.http.delete(`${this.base}/outfitStyles/${encodeURIComponent(id)}`); }
}
