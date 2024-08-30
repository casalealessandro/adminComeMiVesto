import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs/internal/Observable';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { firstValueFrom, lastValueFrom, map} from 'rxjs';
import { UserProfile, Utente } from '../interface/app.interface';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { FirebaseApp } from '@angular/fire/app';
import { HttpsCallableResult } from '@angular/fire/functions';
@Injectable({
  providedIn: 'root'
})

export class UserService {



  api = environment.BASE_API_URL

  isLoginUser: boolean = false; // set null initial value
  TokenLoggato!: string;
  sessionToken: any;
  firestore= inject(AngularFirestore);
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

  isLoggedUser(): Observable<boolean> {

    return this.isExistsUsers().pipe(
      map(infoUser => {
        // Se infoUser non è null o undefined e l'ID è presente e l'utente non è sospeso, restituisci true, altrimenti false
        //this.InfoUtenteConnesso = infoUser
        return infoUser && infoUser.id && !infoUser['sospeso'];
      })
    );
  }

  isExistsUsers() {
    const EndPoint = environment.BASE_API_URL + 'Account/GetUserInfo';
    const HeaderOdata = this.httpOptions;
    return this.httpClient.get<any>(EndPoint, HeaderOdata);
  }

  loginUser(data: any): Observable<any> {
    const EndPoint = environment.BASE_API_URL + 'Token/login';
    const HeaderOdata = this.httpOptions;
    return this.httpClient.post<any>(EndPoint, data, HeaderOdata);
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

  set token(sToken:string) {
    sessionStorage.setItem('token', sToken)
    this.sessionToken = sToken
    //this.TokenLoggato.access_token = token;
  }

  get token() {
    return  sessionStorage.getItem('token') ?? '';
    
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

  async RecuperaPassword(user: string) {
    const EndPoint = environment.BASE_API_URL + "Account/RecuperaPassword?username=" + user;
    const HeaderOdata = this.httpOptions;
    const response = this.httpClient.get(EndPoint, HeaderOdata)
    return await lastValueFrom(response)

  }

  


 

  
}
