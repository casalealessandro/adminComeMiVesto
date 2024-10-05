import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProdottiOnlineService {
  constructor(private http: HttpClient) { }
  private baseUrl: string = 'https://api.tradedoubler.com/1.0/products.json;'; // URL base per i feed dei prodotti

  
  private tokenStr = "token=83C91107EA3A44C6B67AD66A2799E13653192324";
  /**
   * Recupera i prodotti da un determinato store con paginazione.
   * @param store Il nome dello store da cui recuperare i prodotti.
   * @param page La pagina da recuperare (per la paginazione).
   * @returns Un Observable contenente i prodotti e altre informazioni.
   */
  getProdottiFromFeed(store: string, page: number): Observable<any> {
    const url = this.buildUrl(store, page);
    return this.http.get<any>(url).pipe(
      map(response => {
       
        return response;
      })
    );
  }

  /**
   * Costruisce l'URL completo per il feed del prodotto, includendo lo store e la pagina.
   * @param store Il nome dello store.
   * @param page La pagina da recuperare.
   * @returns L'URL completo per la richiesta HTTP.
   */
  private buildUrl(storeId: string, page: number): string {
  

   //https://api.tradedoubler.com/1.0/products.json;page=1;pageSize=100;fid=44191?token=83C91107EA3A44C6B67AD66A2799E13653192324

    return `${this.baseUrl};page=${page};pageSize=100;fid=${storeId}?${this.tokenStr}`;
  }

   
}
