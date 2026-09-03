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
  gender: string; // Assumendo che i valori possibili siano solo "man" o "woman"
  style: string; // Assumendo alcuni stili possibili
  season: string; // Assumendo alcune stagioni possibili
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

  isLoginUser: boolean = false; // set null initial value
  sessionToken: any;
  firestore = inject(AngularFirestore);
  httpClient = inject(HttpClient)
  backendBase = environment.apiBaseUrl
  resultsSignal = signal<any[]>([]);
  pagination = signal({ page: 1, limit: 10, total: 0 });
  feedUrl: string = "https://api.tradedoubler.com/1.0/products.json"

  // Definizione di un signal con un array vuoto come valore iniziale
  mySignal = signal<any[]>([]);

  // Metodo per aggiornare il valore del signal
  setMySignal(data: any[]) {
    this.mySignal.set(data);
  }

  // Getter per ottenere il valore corrente del signal
  getMySignal() {
    return this.mySignal();
  }

  async getOutfits(filters: Record<string, string> | FireBaseConditions[] = {}, page = 1, limit = 10): Promise<outfit[]> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    const filterEntries = Array.isArray(filters) ? filters.map(item => [item.field, String(item.value)] as const) : Object.entries(filters);
    filterEntries.forEach(([key, value]) => { if (value) params = params.set(key, value); });
    const response = await lastValueFrom(this.httpClient.get<any>(`${this.backendBase}/gen/outfits`, { params }));
    const results = response.data || [];
    this.pagination.set(response.pagination || { page, limit, total: results.length });
    this.resultsSignal.set(results);
    return results;
  }

  async getOutfitUser(userId: string): Promise<UserProfile[]> {
    const response = await lastValueFrom(this.httpClient.get<any>(`${this.backendBase}/user/user-profile/${encodeURIComponent(userId)}`));
    return [response.data || response];
  }

  async getOutfitById(outfitId: string): Promise<outfit[]> {
    const response = await lastValueFrom(this.httpClient.get<any>(`${this.backendBase}/gen/outfits/${encodeURIComponent(outfitId)}`));
    return [response.data || response];
  }

  async saveOutfitCollection(_nameDoc: string | undefined, data: any, _reget = true): Promise<boolean> {
    const body = this.createDto(data);
    await lastValueFrom(this.httpClient.post(`${this.backendBase}/gen/outfits`, body));
    return true;
  }

  async updateInCollection(id: string, data: Partial<outfit>): Promise<boolean> {
    const body = this.updateDto(data);
    await lastValueFrom(this.httpClient.put(`${this.backendBase}/gen/outfits/${encodeURIComponent(id)}`, body));
    return true;
  }

  async removeOutfit(id: string): Promise<boolean> {
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


  //Funzione per salvare gli outfit ottenuti e mappati
  async JsonOutfits(): Promise<boolean> {


    try {
      const prod = this.getProductsFromFeed();
      prod.subscribe(async resProd => {
        console.log('resProd', resProd)

        resProd.forEach(async (element: outfit) => {
          let condition: FireBaseConditions[] = [{
            field: 'id',
            operator: '==',
            value: element.id
          }]
          let check = await this.getOutfits(condition)
          if (check.length == 0) {
            let ress = await this.saveOutfitCollection(element.id, element, false);
            if (!ress) {
              console.log("c'è stato un problema")
            }
          }

        });

        await this.getOutfits()

        return true
      })
    } catch (error) {
      console.error('Errore:', error)
      return false
    }
    return false

  }

  // Funzione per ottenere i prodotti dal feed e trasformarli
  getProductsFromFeed(page: number = 1, fid: number = 104437): Observable<any[]> {
    const queryString = `;page=${page};pageSize=100;fid=${fid}?token=83C91107EA3A44C6B67AD66A2799E13653192324"`
    return this.httpClient.get<any>("https://api.tradedoubler.com/1.0/products.json;page=1;pageSize=100;fid=104437?token=83C91107EA3A44C6B67AD66A2799E13653192324").pipe(
      map(response => {
        /* const girlProducts = response.products.filter((item: any) =>
          item.categories.some((cat: any) => cat.name.toLowerCase() === 'Dress')
        ); */

        // Prendi solo i primi 4 prodotti della categoria "girl" e mappa
        return response.products.map((item: any) => this.mapToFirebase(item,));
      })
    );
  }


  // Funzione di mappatura per convertire il formato del prodotto
  private mapToFirebase(item: any): outfit {
    const date = new Date
    return {
      style: 'C', // mappalo secondo la logica della tua app
      visits: 0,
      outfitSubCategory: ['CDC'],
      gender: 'D',
      createdAt: date.getTime(),
      editedAt: date.getTime(),
      id: item.offers[0].id,
      feedId: item.offers[0].feedId,
      tags: [
        {
          brend: 'vestitielegantishop',
          x: 0.60,
          outfitCategory: 'ABC',
          color: '',
          y: 0.60,
          name: item.name,
          id: item.offers[0].id,
          outfitSubCategory: 'CDC',
          link: item.offers[0].productUrl,
          imageUrl: item.productImage.url,
          prezzo: item.offers[0].priceHistory[0].price.value
        }
      ],
      description: item.description.replace("Controlla la tabella taglie e misure, per sapere se la taglia dell'abito è adatta alle tue misure corporee.", ''),
      userId: 'yoq2HOxUJhdn4shCUgIB8ICMBVq2',
      season: 'E',
      imageUrl: item.productImage.url,

      status: 'pending',
      likes: 0,
      title: item.name,
      outfitCategory: ['ABC'],
      userName: 'Maria '
    };
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

    // Applica questa condizione alla query

   

    try {
       // Elimina il doc che corrispondono al ID
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
      // Applica tutte le condizioni alla query 
      conditions.forEach(condition => {
        
        query = query.where(condition.field, condition.operator, condition.value);
        //console.log('conditions-->',query)
      });
    }

    if(orderBy){
      // Applica l'ordinamento alla query
      orderBy.forEach(order => {
        query = query.orderBy(order.field, order.by);
      });
    }
     
    
    try {
      
      const querySnapshot = await query.get();

      const results = querySnapshot.docs.map((doc: any) => doc.data());
      //this.resultsSignal.set(results);
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
