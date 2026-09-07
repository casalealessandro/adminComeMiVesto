import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs/internal/Observable';
import { lastValueFrom, map } from 'rxjs';
import { UserProfile } from '../interface/app.interface';
import { AngularFirestore } from '@angular/fire/compat/firestore';

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
  outfitSubCategory?: any,
  outfitCategory?: any,
  status: 'approved' | 'rifiutato' | 'pending'
  feedId?: any

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
  editedAt?: number
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
  images?: string[]
}[]

export interface wardrobesItem {
  id: number;
  userId: string;
  name: string;
  outfitCategory: string;
  outfitSubCategory: string;
  brend: string;
  color:string;
  link?: string;
  images: string[];
  ImageUrl?:string;
  imageUrl?:string;
  prezzo?:number;
  gender?:any;
}

export interface FireBaseConditions {
  field: string;
  operator: string;
  value: any
}[]

export interface FireBaseOrderBy {
  field: string;
  by: 'asc' | 'desc'
}[]

@Injectable({
  providedIn: 'root'
})
export class OutfitsService {

  api = environment.BASE_API_URL

  isLoginUser: boolean = false;
  sessionToken: any;
  firestore = inject(AngularFirestore);
  httpClient = inject(HttpClient)
  backendBase = environment.apiBaseUrl
  resultsSignal = signal<any[]>([]);
  pagination = signal({ page: 1, limit: 10, total: 0 });

  mySignal = signal<any[]>([]);

  setMySignal(data: any[]) {
    this.mySignal.set(data);
  }

  getMySignal() {
    return this.mySignal();
  }

  async getAdminOutfits(filters: Record<string, string> = {}, page = 1, limit = 10): Promise<outfit[]> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    Object.entries(filters).forEach(([key, value]) => { if (value) params = params.set(key, value); });
    const response = await lastValueFrom(this.httpClient.get<any>(`${this.backendBase}/gen/outfits`, { params }));
    const results = response.data || [];
    this.pagination.set(response.pagination || { page, limit, total: results.length });
    this.resultsSignal.set(results);
    return results;
  }

  async getAdminOutfitUser(userId: string): Promise<UserProfile[]> {
    const response = await lastValueFrom(this.httpClient.get<any>(`${this.backendBase}/user/user-profile/${encodeURIComponent(userId)}`));
    return [response.data || response];
  }

  async getAdminOutfitById(outfitId: string): Promise<outfit[]> {
    const response = await lastValueFrom(this.httpClient.get<any>(`${this.backendBase}/gen/outfits/${encodeURIComponent(outfitId)}`));
    return [response.data || response];
  }

  async createAdminOutfit(data: any): Promise<boolean> {
    const body = this.createDto(data);
    await lastValueFrom(this.httpClient.post(`${this.backendBase}/gen/outfits`, body));
    return true;
  }

  async updateAdminOutfit(id: string, data: Partial<outfit>): Promise<boolean> {
    const body = this.updateDto(data);
    await lastValueFrom(this.httpClient.put(`${this.backendBase}/gen/outfits/${encodeURIComponent(id)}`, body));
    return true;
  }

  async deleteAdminOutfit(id: string): Promise<boolean> {
    await lastValueFrom(this.httpClient.delete(`${this.backendBase}/gen/outfits/${encodeURIComponent(id)}`));
    return true;
  }

  private createDto(data: any): any {
    const allowed = ['title', 'description', 'imageUrl', 'tags', 'gender', 'style', 'season', 'color', 'outfitCategory', 'outfitSubCategory', 'userId'];
    return Object.fromEntries(allowed.filter(key => data[key] !== undefined).map(key => [key, data[key]]));
  }

  private updateDto(data: any): any {
    const allowed = ['title', 'description', 'imageUrl', 'tags', 'gender', 'style', 'season', 'color', 'outfitCategory', 'outfitSubCategory', 'status'];
    return Object.fromEntries(allowed.filter(key => data[key] !== undefined).map(key => [key, data[key]]));
  }

  async getOutfits(conditions?: FireBaseConditions[], orderBy?: FireBaseOrderBy[]): Promise<outfit[]> {

    let query: any = this.firestore.collection('outfits').ref;

    if (conditions) {
      conditions.forEach(condition => {
        query = query.where(condition.field, condition.operator, condition.value);
      });
    }

    if (orderBy) {
      orderBy.forEach(order => {
        query = query.orderBy(order.field, order.by);
      });
    }

    try {
      const querySnapshot = await query.get();
      const results = querySnapshot.docs.map((doc: any) => doc.data());
      this.resultsSignal = signal<any[]>(results);
      return results;
    } catch (error) {
      console.error('Error getting filtered collection:', error);
      return [];
    }
  }

  async saveOutfitCollection(nameDoc: string | undefined, data: any, reget: boolean = true): Promise<boolean> {

    try {
      const Collection = await this.firestore.collection('outfits')
      if (!nameDoc) {
        Collection.add(data);
        if (reget) {
          this.getOutfits()
        }
        return true
      } else {
        Collection.doc(nameDoc).set(data);
        if (reget) {
          this.getOutfits()
        }
        return true
      }
    } catch (error) {
      return false
    }
  }

  //Prodotti Creati e messi a disposizione nell'app
  getProducts(): Observable<wardrobesItem[]>{
    return this.firestore.collection('outfitsProducts').valueChanges().pipe(
      map((Products: any[]) => {
        return Products;
      })
    );
  }

  updateProductOutfit(nameDoc:any,data:any){
    try {
      this.firestore.collection('outfitsProducts').doc(nameDoc).update(data);
      return true
    } catch (error) {
      console.log(error)
      return false
    }
  }

  async removeProductOutfit(id: any): Promise<boolean> {
    let query = this.firestore.collection('outfitsProducts').doc(id).ref
    try {
      await query.delete();
      return true
    } catch (error) {
      console.error('Error deleting documents:', error);
      return false
    }
  }

  /**Categorie Outfits**/
  getOutFitCategories(idParent?: string): Observable<outfitCategories[]> {
    const url = idParent
      ? `${this.backendBase}/gen/outfitCategories/${encodeURIComponent(idParent)}`
      : `${this.backendBase}/gen/outfitCategories`;
    return this.httpClient.get<any>(url).pipe(map(response => response.data || response));
  }

  async updateOutfitCategories(categoryId: string, data: Partial<outfitCategories>): Promise<boolean> {
    const { id, createdAt, editedAt, ...candidate } = data;
    const allowed = ['categoryName', 'parentCategory', 'status', 'order', 'gender', 'imageUrl'];
    const body = Object.fromEntries(allowed.filter(key => (candidate as any)[key] !== undefined).map(key => [key, (candidate as any)[key]]));
    await lastValueFrom(this.httpClient.put(`${this.backendBase}/gen/outfitCategory/${encodeURIComponent(categoryId)}`, body));
    return true;
  }

  async saveOutfitCategories(data: outfitCategories): Promise<boolean> {
    const allowed = ['id', 'categoryName', 'parentCategory', 'status', 'order', 'gender', 'imageUrl'];
    const body = Object.fromEntries(allowed.filter(key => (data as any)[key] !== undefined).map(key => [key, (data as any)[key]]));
    await lastValueFrom(this.httpClient.post(`${this.backendBase}/gen/outfitCategories`, body));
    return true;
  }

  async removeOutfitCategories(id: string): Promise<boolean> {
    await lastValueFrom(this.httpClient.delete(`${this.backendBase}/gen/outfitCategory/${encodeURIComponent(id)}`));
    return true;
  }

  /**Promise**/
  async getFilteredCollection(collection: string, conditions?:FireBaseConditions[],orderBy?:any[]): Promise<any[]> {

    let query: any = this.firestore.collection(collection).ref;

    if(conditions){
      conditions.forEach(condition => {
        query = query.where(condition.field, condition.operator, condition.value);
      });
    }

    if(orderBy){
      orderBy.forEach(order => {
        query = query.orderBy(order.field, order.by);
      });
    }

    try {
      const querySnapshot = await query.get();
      const results = querySnapshot.docs.map((doc: any) => doc.data());
      this.resultsSignal = signal<any[]>(results);
      return results;
    } catch (error) {
      console.error('Error getting filtered collection:', error);
      return [];
    }
  }

  //Salvataggio in FireStone
  async saveOutfitsProducts(nameDoc: string | undefined, data: any): Promise<boolean> {

    try {
      const Collection = await this.firestore.collection('outfitsProducts')
      if (!nameDoc) {
        Collection.add(data);
        return true
      } else {
        Collection.doc(nameDoc).set(data);
        return true
      }
    } catch (error) {
      return false
    }
  }
}
