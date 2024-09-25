import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs/internal/Observable';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { firstValueFrom, lastValueFrom, map, of} from 'rxjs';
import { UserProfile, Utente } from '../interface/app.interface';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { FirebaseApp } from '@angular/fire/app';

export interface outfit {
  userName: any;
  id: any;
  title: string;
  description?: string;
  imageUrl: string;
  tags: any[];
  gender: '' | 'man' | 'woman'; // Assumendo che i valori possibili siano solo "man" o "woman"
  style: '' | 'casual' | 'elegant' | 'sporty' | 'formal'; // Assumendo alcuni stili possibili
  season: '' | 'winter' | 'spring' | 'summer' | 'autumn'; // Assumendo alcune stagioni possibili
  color?: string;
  userId: any;
  visits?:number;
  likes?:number;
  createdAt?:any;
  editedAt?:any;
  
  status:'approvato' | 'rifiutato' | 'pending' 

}

export interface FireBaseConditions {
  field: string; 
  operator: string; 
  value: any 
}[]

export interface FireBaseOrderBy{
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
  firestore= inject(AngularFirestore);
  httpClient= inject(HttpClient)
  auth = getAuth(inject(FirebaseApp));
  functions=inject(AngularFireFunctions)
  apiFire="https://us-central1-comemivesto-5e5f9.cloudfunctions.net/api"
  resultsSignal = signal<outfit[]>([]);
  


 

  
  async getOutfits(conditions?:FireBaseConditions[],orderBy?:FireBaseOrderBy[]):Promise<outfit[]>{

    let query: any = this.firestore.collection('outfits').ref;
    
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
     
    // Imposta il limite a 10
    query = query.limit(10);
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

  async getOutfitUser(userId:any):Promise<UserProfile[]>{

    let query =  this.firestore.collection('users').ref.where('uid', '==', userId)

    const querySnapshot = await query.get();

    const results = querySnapshot.docs.map((doc: any) => doc.data());
    return results
  }

   
  //Salvataggio in FireStone

  async saveOutfitCollection(nameDoc: string | undefined, data: any): Promise<boolean> {
    
    try {
      const Collection = await this.firestore.collection('outfits')
      if (!nameDoc) {
        Collection.add(data);
        this.getOutfits()
        return true
      } else {
        this.getOutfits()
        Collection.doc(nameDoc).set(data);
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

      return false
    }

  }

  async removeOutfit(id:any): Promise<boolean>{
  
    let query: any = this.firestore.collection('outfits').ref;

    // Applica questa condizione alla query
    
    query = query.where('id','==', id);

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


  


 

  
}
