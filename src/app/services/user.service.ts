import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs/internal/Observable';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { firstValueFrom, lastValueFrom, map} from 'rxjs';
import { UserProfile, Utente } from '../interface/app.interface';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { FirebaseApp } from '@angular/fire/app';
import { HttpsCallableResult } from '@angular/fire/functions';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { limitToLast } from 'firebase/firestore/lite';
@Injectable({
  providedIn: 'root'
})

export class UserService {
  


  api = environment.BASE_API_URL

  isLoginUser = signal<boolean>(false); // set null initial value
  TokenLoggato!: string;
  sessionUserId: any;
  firestore= inject(AngularFirestore);
  angularFireAuth= inject(AngularFireAuth);
  httpClient= inject(HttpClient)
  auth = getAuth(inject(FirebaseApp));
  functions=inject(AngularFireFunctions)
  apiFire="https://us-central1-comemivesto-5e5f9.cloudfunctions.net/api"

  get httpOptions() {
    return {
      headers: new HttpHeaders().set(
        "Authorization", 'Bearer ' + this.token
      ).set('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')
        .set('Content-Type', 'application/json; charset=utf-8'),
      params: new HttpParams()
    }
  };
  
  set token(sToken:string) {
    sessionStorage.setItem('token', sToken)
    
  }

  get token() {
    return  sessionStorage.getItem('token') ?? '';
    
  }

  get InfoUtenteConnesso(): Utente {
    let utenteConnesso: string = sessionStorage.getItem('utenteConnesso') ?? '';
    return JSON.parse(utenteConnesso);
  }

  
  getUsers():Observable<UserProfile[]>{

    return this.firestore.collection('users').valueChanges().pipe(

      map((users: any[]) => {
        return users
       
      })
    );
  }

  isLoggedUser(): boolean {
    this.isLoginUser.set(this.token ? true : false);
    return this.token ? true : false;
  }

  isExistsUsers() {
    const EndPoint = environment.BASE_API_URL + 'Account/GetUserInfo';
    const HeaderOdata = this.httpOptions;
    return this.httpClient.get<any>(EndPoint, HeaderOdata);
  }

  async loginUser(data: any): Promise<boolean> {
    const EndPoint = `${this.apiFire}/user/login` //environment.BASE_API_URL + 'Token/login';
    const HeaderOdata = this.httpOptions;
    
    try {

      const resAuth = await this.authFirebase(data);
      if(resAuth){
        let res =  this.httpClient.post<any>(EndPoint, data, HeaderOdata);

        const result = await lastValueFrom(res)

        if (result){
          this.token = result;
          this.isLoginUser.set(true);
          return true;
        }  
      }
        
    } catch (error) {
      console.error(error);
      return false;
    }

    return false;
  }

  async LogOut() {

    const EndPoint = environment.BASE_API_URL + 'Token/Logout';
    const HeaderOdata = this.httpOptions;



    const response = this.httpClient.get<any>(EndPoint, HeaderOdata);

    return await lastValueFrom(response)

  }


  clearSessionStorage() {
    let sessLength = sessionStorage.length


    if (sessLength > 0)
      for (let sessionKey in sessionStorage) {
        sessionStorage.removeItem(sessionKey);



      }


  }

  
  async authFirebase(data: any):Promise<boolean> {
    try {
      // Effettua l'autenticazione con email e password
      const credential = await this.angularFireAuth.signInWithEmailAndPassword(data.email, data.password);
      sessionStorage.setItem('utenteConnesso', JSON.stringify(credential.user));
  
      // Ritorna true per indicare il successo
      return true;
    } catch (error) {
      console.error('Errore durante l\'autenticazione:', error);
  
      // In caso di errore, ritorna false
      return false;
    }

  }
  async sendPasswordFirebase(email:string):Promise<boolean>{
    
    try {

      await sendPasswordResetEmail(this.auth,email)
      return true
    } catch(err){
      return false
    }
    
   
  }

  async disabledUsersFirebase(uid: string): Promise<boolean> {
    const api = `${this.apiFire}/users/disable/${uid}`
    let data={
      uid:uid
    }
     

    try {
      let call = this.httpClient.post(api,data)
      const result = await lastValueFrom(call);
      console.log(result);
      return true;
    } catch (error) {
      console.error('Errore nella disabilitazione dell\'utente:', error);
      return false;
    }
   
  }

  async deleteUsersFirebase(uid: string): Promise<boolean> {
    const api = `${this.apiFire}/users/delete/${uid}`
    let data={
      uid:uid
    }
     

    try {
      let call = this.httpClient.delete(api)
      const result = await lastValueFrom(call);
      if(result){
        let query: any = this.firestore.collection('users').ref;

        // Applica questa condizione alla query
        
        query = query.where('uid','==', uid);

        try {
          const querySnapshot = await query.get();
          // Elimina tutti i documenti che corrispondono alla query
          const deletePromises = querySnapshot.docs.map((doc: any) => doc.ref.delete());
          await Promise.all(deletePromises);
          this.getUsers()
          return true
        } catch (error) {
          console.error('Error deleting documents:', error);
          return false
        }
      }
      
      return true;
    } catch (error) {
      console.error(`Errore nell'eliminazione dell\'utente:`, error);
      return false;
    }
   
  }

  async RecuperaPassword(user: string) {
    const EndPoint = environment.BASE_API_URL + "Account/RecuperaPassword?username=" + user;
    const HeaderOdata = this.httpOptions;
    const response = this.httpClient.get(EndPoint, HeaderOdata)
    return await lastValueFrom(response)

  }

  
  getUserProfile(uid: any):Observable<UserProfile>  {

    let EndPoint = `${this.apiFire}/user/user-profile`


    if (uid) {
      EndPoint = `${EndPoint}/${uid}`
    } 


    const HeaderOdata = this.httpOptions

    const response = this.httpClient.get(EndPoint, HeaderOdata)

    return response.pipe(map((res: any) => {
      return res as UserProfile;
    }));
      
  }

 

  
}
