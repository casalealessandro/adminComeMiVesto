import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AffiliateCatalogAudit } from '../models/affiliate-catalog-audit.models';
import {
  AffiliateFeed,
  AffiliateProgram,
  AffiliateSyncRun,
  CatalogProduct,
} from '../models/affiliate-catalog.models';
import {
  AffiliateApiResponse,
  AffiliateCursorPage,
  AffiliateCursorRequest,
  AffiliateFeedCreateInput,
  AffiliateFeedCreateResponse,
  AffiliateFeedMappingResponse,
  AffiliateFeedUpdateInput,
  AffiliateProductCursorRequest,
  AffiliateProgramCreateInput,
  AffiliateProgramUpdateInput,
  OutfitColorOption,
} from '../models/affiliate-catalog-api.models';

@Injectable({ providedIn: 'root' })
export class AffiliateCatalogService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiBaseUrl;
  private readonly baseUrl = `${this.apiUrl}/admin/affiliate`;

  getCatalogAudit(): Observable<AffiliateCatalogAudit> {
    return this.http
      .get<AffiliateApiResponse<AffiliateCatalogAudit>>(`${this.baseUrl}/catalog-audit`)
      .pipe(map((response) => response.data));
  }

  getOutfitColors(): Observable<OutfitColorOption[]> {
    return this.http.get<OutfitColorOption[]>(`${this.apiUrl}/gen/outfitColors`);
  }

  getPrograms(): Observable<AffiliateProgram[]> {
    return this.http
      .get<AffiliateApiResponse<AffiliateProgram[]>>(`${this.baseUrl}/programs`)
      .pipe(map((response) => response.data));
  }

  getProgram(id: string): Observable<AffiliateProgram> {
    return this.http
      .get<AffiliateApiResponse<AffiliateProgram>>(`${this.baseUrl}/programs/${id}`)
      .pipe(map((response) => response.data));
  }

  createProgram(input: AffiliateProgramCreateInput): Observable<AffiliateProgram> {
    return this.http
      .post<AffiliateApiResponse<AffiliateProgram>>(`${this.baseUrl}/programs`, input)
      .pipe(map((response) => response.data));
  }

  updateProgram(id: string, input: AffiliateProgramUpdateInput): Observable<AffiliateProgram> {
    return this.http
      .put<AffiliateApiResponse<AffiliateProgram>>(`${this.baseUrl}/programs/${id}`, input)
      .pipe(map((response) => response.data));
  }

  getFeeds(affiliateProgramId?: string): Observable<AffiliateFeed[]> {
    let params = new HttpParams();
    if (affiliateProgramId) {
      params = params.set('affiliateProgramId', affiliateProgramId);
    }

    return this.http
      .get<AffiliateApiResponse<AffiliateFeed[]>>(`${this.baseUrl}/feeds`, { params })
      .pipe(map((response) => response.data));
  }

  getFeed(id: string): Observable<AffiliateFeed> {
    return this.http
      .get<AffiliateApiResponse<AffiliateFeed>>(`${this.baseUrl}/feeds/${id}`)
      .pipe(map((response) => response.data));
  }

  createFeed(input: AffiliateFeedCreateInput): Observable<AffiliateFeedCreateResponse> {
    return this.http.post<AffiliateFeedCreateResponse>(`${this.baseUrl}/feeds`, input);
  }

  updateFeed(id: string, input: AffiliateFeedUpdateInput): Observable<AffiliateFeed> {
    return this.http
      .put<AffiliateApiResponse<AffiliateFeed>>(`${this.baseUrl}/feeds/${id}`, input)
      .pipe(map((response) => response.data));
  }

  updateFeedWithSourceValues(id: string, input: AffiliateFeedUpdateInput): Observable<AffiliateFeedMappingResponse> {
    const params = new HttpParams().set('sourceValues', 'true');
    return this.http.put<AffiliateFeedMappingResponse>(`${this.baseUrl}/feeds/${id}`, input, { params });
  }

  syncFeed(id: string): Observable<AffiliateSyncRun> {
    return this.http
      .post<AffiliateApiResponse<AffiliateSyncRun>>(`${this.baseUrl}/feeds/${id}/sync`, {})
      .pipe(map((response) => response.data));
  }

  getProducts(request?: AffiliateProductCursorRequest): Observable<AffiliateCursorPage<CatalogProduct>> {
    return this.http.get<AffiliateCursorPage<CatalogProduct>>(
      `${this.baseUrl}/products`,
      { params: this.buildProductParams(request) },
    );
  }

  getProduct(id: string): Observable<CatalogProduct> {
    return this.http
      .get<AffiliateApiResponse<CatalogProduct>>(`${this.baseUrl}/products/${id}`)
      .pipe(map((response) => response.data));
  }

  getSyncRuns(request?: AffiliateCursorRequest): Observable<AffiliateCursorPage<AffiliateSyncRun>> {
    return this.http.get<AffiliateCursorPage<AffiliateSyncRun>>(
      `${this.baseUrl}/sync-runs`,
      { params: this.buildCursorParams(request) },
    );
  }

  getSyncRun(id: string): Observable<AffiliateSyncRun> {
    return this.http
      .get<AffiliateApiResponse<AffiliateSyncRun>>(`${this.baseUrl}/sync-runs/${id}`)
      .pipe(map((response) => response.data));
  }

  private buildProductParams(request?: AffiliateProductCursorRequest): HttpParams {
    let params = this.buildCursorParams(request);
    if (request?.q) {
      params = params.set('q', request.q);
    }
    if (request?.category) {
      params = params.set('category', request.category);
    }
    if (request?.affiliateProgramId) {
      params = params.set('affiliateProgramId', request.affiliateProgramId);
    }
    return params;
  }

  private buildCursorParams(request?: AffiliateCursorRequest): HttpParams {
    let params = new HttpParams();

    if (request?.limit !== undefined) {
      params = params.set('limit', request.limit.toString());
    }
    if (request?.cursor) {
      params = params.set('cursor', request.cursor);
    }

    return params;
  }
}
