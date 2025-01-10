import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs/internal/Observable';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { firstValueFrom, lastValueFrom, map, of } from 'rxjs';
import { UserProfile, Utente } from '../interface/app.interface';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { FirebaseApp } from '@angular/fire/app';
import { Data } from '@angular/router';
import { doc } from 'firebase/firestore';

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
  TokenLoggato!: string;
  sessionToken: any;
  firestore = inject(AngularFirestore);
  httpClient = inject(HttpClient)
  auth = getAuth(inject(FirebaseApp));
  functions = inject(AngularFireFunctions)
  apiFire = "https://us-central1-comemivesto-5e5f9.cloudfunctions.net/api"
  resultsSignal = signal<any[]>([]);
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

  login(){
    const  headers={
      headers: new HttpHeaders().set(
        "Authorization", 'Bearer ' 
      ).set('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')
        .set('Content-Type', 'application/json; charset=utf-8')
        .set('responseType','text'),
      params: new HttpParams(),
      responseType: 'text' as 'json'  // Aggiungi responseType qui

     
    }

    const api = "http://192.168.1.170:8080/authenticate"

    this.httpClient.post(api, {email: 'prova2', password: 'prova2'}, headers).subscribe(res=>{
      console.log(res)
    })
  }
  

  async getOutfits(conditions?: FireBaseConditions[], orderBy?: FireBaseOrderBy[]): Promise<outfit[]> {

    let query: any = this.firestore.collection('outfits').ref;

    if (conditions) {
      // Applica tutte le condizioni alla query 
      conditions.forEach(condition => {

        query = query.where(condition.field, condition.operator, condition.value);
        //console.log('conditions-->',query)
      });
    }

    if (orderBy) {
      // Applica l'ordinamento alla query
      orderBy.forEach(order => {
        query = query.orderBy(order.field, order.by);
      });
    }

    // Imposta il limite a 10
    //query = query.limit(10);
    try {

      const querySnapshot = await query.get();

      const results = querySnapshot.docs.map((doc: any) => doc.data());
      this.resultsSignal = signal<any[]>(results);
      return results;  // Usa `of` per restituire un Observable
    } catch (error) {
      console.error('Error getting filtered collection:', error);
      return [];  // Usa `of` per restituire un Observable
    }



    /*    return this.firestore.collection('outfits').valueChanges().pipe(
   
         map((users: any[]) => {
           return users
          
         })
       ); */
  }

  async getOutfitUser(userId: any): Promise<UserProfile[]> {

    let query = this.firestore.collection('users').ref.where('uid', '==', userId)

    const querySnapshot = await query.get();

    const results = querySnapshot.docs.map((doc: any) => doc.data());
    return results
  }

  async getOutfitById(outfitId: any): Promise<outfit[]> {
   
    let query = this.firestore.collection('outfits').ref.where('id', '==', outfitId)

    const querySnapshot = await query.get();

    const results = querySnapshot.docs.map((doc: any) => doc.data()) as outfit[];
    return results
  }

  //Salvataggio in FireStone

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

  //Modifica in FireStone

  async updateInCollection(nameDoc: any, data: Partial<any>): Promise<boolean> {
    try {

      this.firestore.collection('outfits').doc(nameDoc).update(data);
      this.getOutfits()
      return true


    } catch (error) {
      console.log(error)
      return false
    }

  }

  async removeOutfit(id: any): Promise<boolean> {

    let query: any = this.firestore.collection('outfits').ref;

    // Applica questa condizione alla query

    query = query.where('id', '==', id);

    try {
      const querySnapshot = await query.get();
      // Elimina tutti i documenti che corrispondono alla query
      const deletePromises = querySnapshot.docs.map((doc: any) => doc.ref.delete());
      await Promise.all(deletePromises);
      this.getOutfits()
      return true
    } catch (error) {
      console.error('Error deleting documents:', error);
      return false
    }
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


  getOutFitCategories(idParent?: any): Observable<outfitCategories[]> {

    return this.firestore.collection('outfitsCategories', ref => {
      if (idParent) {
        // Se idParent è fornito, applica il filtro
        return ref.where('parentCategory', '==', idParent);
      } else {
        return ref.where('parentCategory', '==', '');

      }
    }).valueChanges().pipe(
      map((Categories: any[]) => {
        return Categories;
      })
    );
  }

  async updateOutfitCategories(categoriesId: string, data: Partial<outfitCategories>): Promise<boolean> {
    try {

      this.firestore.collection('outfitsCategories').doc(categoriesId).update(data);

      return true


    } catch (error) {
      console.log(error)
      return false
    }
  }

  async saveOutfitCategories(data: outfitCategories): Promise<boolean> {
    try {
      const Collection = await this.firestore.collection('outfitsCategories')
      if (!data.id) {
        Collection.add(data);


        return true
      } else {
        Collection.doc(data.id).set(data);

        //this.getOutFitCategories()


        return true
      }

    } catch (error) {


      return false
    }
  }

  async removeOutfitCategories(id: any): Promise<boolean> {

    let query: any = this.firestore.collection('outfitsCategories').ref;

    // Applica questa condizione alla query

    query = query.where('id', '==', id);

    try {
      const querySnapshot = await query.get();
      // Elimina tutti i documenti che corrispondono alla query
      const deletePromises = querySnapshot.docs.map((doc: any) => doc.ref.delete());
      await Promise.all(deletePromises);
      this.getOutFitCategories()
      return true
    } catch (error) {
      console.error('Error deleting documents:', error);
      return false
    }
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
