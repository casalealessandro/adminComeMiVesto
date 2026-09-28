import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { StaticPage, StaticPageApiResponse, StaticPageInput } from '../models/static-page.models';

@Injectable({ providedIn: 'root' })
export class StaticPageService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/admin/static-pages`;

  getPages(): Observable<StaticPage[]> {
    return this.http
      .get<StaticPageApiResponse<StaticPage[]>>(this.baseUrl)
      .pipe(map((response) => response.data));
  }

  getPage(id: string): Observable<StaticPage> {
    return this.http
      .get<StaticPageApiResponse<StaticPage>>(`${this.baseUrl}/${id}`)
      .pipe(map((response) => response.data));
  }

  createPage(input: StaticPageInput): Observable<StaticPage> {
    return this.http
      .post<StaticPageApiResponse<StaticPage>>(this.baseUrl, input)
      .pipe(map((response) => response.data));
  }

  updatePage(id: string, input: StaticPageInput): Observable<StaticPage> {
    return this.http
      .put<StaticPageApiResponse<StaticPage>>(`${this.baseUrl}/${id}`, input)
      .pipe(map((response) => response.data));
  }

  deletePage(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
