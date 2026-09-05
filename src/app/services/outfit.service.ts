import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { lastValueFrom, map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { UserProfile } from '../interface/app.interface';

export interface outfit {
  userName: any;
  id: any;
  title: string;
  description?: string;
  imageUrl: string;
  tags: Tag[];
  gender: string;
  style: string;
  season: string;
  color?: string;
  userId: any;
  visits?: number;
  likes?: number;
  createdAt?: any;
  editedAt?: any;
  outfitSubCategory?: any;
  outfitCategory?: any;
  status: 'approved' | 'rifiutato' | 'pending';
  feedId?: any;
}

export interface outfitCategories {
  id: any;
  imageUrl?: string;
  categoryName: string;
  parentCategory: any;
  status: any;
  order: number;
  gender: any;
  createdAt: number;
  editedAt?: number;
}

export interface Tag {
  id: any;
  name: string;
  x: number;
  y: number;
  link?: string;
  color: string;
  brend?: string;
  outfitCategory: string;
  outfitSubCategory?: string;
  prezzo?: number;
  imageUrl?: string;
  images?: string[];
}

@Injectable({ providedIn: 'root' })
export class OutfitsService {
  private readonly httpClient = inject(HttpClient);
  private readonly backendBase = environment.apiBaseUrl;

  readonly pagination = signal({ page: 1, limit: 10, total: 0 });

  async getAdminOutfits(
    filters: Record<string, string> = {},
    page = 1,
    limit = 10
  ): Promise<outfit[]> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params = params.set(key, value);
    });

    const response = await lastValueFrom(
      this.httpClient.get<any>(`${this.backendBase}/gen/outfits`, { params })
    );
    const results = response.data || [];

    this.pagination.set(response.pagination || { page, limit, total: results.length });
    return results;
  }

  async getAdminOutfitUser(userId: string): Promise<UserProfile[]> {
    const response = await lastValueFrom(
      this.httpClient.get<any>(
        `${this.backendBase}/user/user-profile/${encodeURIComponent(userId)}`
      )
    );
    return [response.data || response];
  }

  async getAdminOutfitById(outfitId: string): Promise<outfit[]> {
    const response = await lastValueFrom(
      this.httpClient.get<any>(
        `${this.backendBase}/gen/outfits/${encodeURIComponent(outfitId)}`
      )
    );
    return [response.data || response];
  }

  async createAdminOutfit(data: any): Promise<boolean> {
    await lastValueFrom(
      this.httpClient.post(`${this.backendBase}/gen/outfits`, this.createDto(data))
    );
    return true;
  }

  async updateAdminOutfit(id: string, data: Partial<outfit>): Promise<boolean> {
    await lastValueFrom(
      this.httpClient.put(
        `${this.backendBase}/gen/outfits/${encodeURIComponent(id)}`,
        this.updateDto(data)
      )
    );
    return true;
  }

  async deleteAdminOutfit(id: string): Promise<boolean> {
    await lastValueFrom(
      this.httpClient.delete(`${this.backendBase}/gen/outfits/${encodeURIComponent(id)}`)
    );
    return true;
  }

  private createDto(data: any): any {
    const allowed = [
      'title',
      'description',
      'imageUrl',
      'tags',
      'gender',
      'style',
      'season',
      'color',
      'outfitCategory',
      'outfitSubCategory',
      'userId'
    ];
    return Object.fromEntries(
      allowed.filter(key => data[key] !== undefined).map(key => [key, data[key]])
    );
  }

  private updateDto(data: any): any {
    const allowed = [
      'title',
      'description',
      'imageUrl',
      'tags',
      'gender',
      'style',
      'season',
      'color',
      'outfitCategory',
      'outfitSubCategory',
      'status'
    ];
    return Object.fromEntries(
      allowed.filter(key => data[key] !== undefined).map(key => [key, data[key]])
    );
  }

  getOutFitCategories(idParent?: string): Observable<outfitCategories[]> {
    const url = idParent
      ? `${this.backendBase}/gen/outfitCategories/${encodeURIComponent(idParent)}`
      : `${this.backendBase}/gen/outfitCategories`;
    return this.httpClient
      .get<any>(url)
      .pipe(map(response => response.data || response));
  }

  async updateOutfitCategories(
    categoryId: string,
    data: Partial<outfitCategories>
  ): Promise<boolean> {
    const { id, createdAt, editedAt, ...candidate } = data;
    const allowed = [
      'categoryName',
      'parentCategory',
      'status',
      'order',
      'gender',
      'imageUrl'
    ];
    const body = Object.fromEntries(
      allowed
        .filter(key => (candidate as any)[key] !== undefined)
        .map(key => [key, (candidate as any)[key]])
    );

    await lastValueFrom(
      this.httpClient.put(
        `${this.backendBase}/gen/outfitCategory/${encodeURIComponent(categoryId)}`,
        body
      )
    );
    return true;
  }

  async saveOutfitCategories(data: outfitCategories): Promise<boolean> {
    const allowed = [
      'id',
      'categoryName',
      'parentCategory',
      'status',
      'order',
      'gender',
      'imageUrl'
    ];
    const body = Object.fromEntries(
      allowed
        .filter(key => (data as any)[key] !== undefined)
        .map(key => [key, (data as any)[key]])
    );

    await lastValueFrom(
      this.httpClient.post(`${this.backendBase}/gen/outfitCategories`, body)
    );
    return true;
  }

  async removeOutfitCategories(id: string): Promise<boolean> {
    await lastValueFrom(
      this.httpClient.delete(
        `${this.backendBase}/gen/outfitCategory/${encodeURIComponent(id)}`
      )
    );
    return true;
  }
}
