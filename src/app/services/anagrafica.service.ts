import { HttpClient} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { lastValueFrom, Observable } from 'rxjs';
import { UserService } from './user.service';



@Injectable({
  providedIn: 'root'
})



export class AnagraficaService {

  token: string = '';
  userService=inject(UserService);
  private apiUrl: string = environment.BASE_API_URL
  constructor(private httpClient: HttpClient, private activatedRoute: ActivatedRoute) {

  }

  get httpOptionCall() {
    return this.userService.httpOptions
  };
  
  /**
   * Retrieves a list of items from a specified subject using the provided query string.
   *
   * @param $subjectCalled - The endPoint from api.
   * @param queryString - The query string to filter the items.
   * @returns An Observable of the retrieved items.
   *
   * @example
   * ```typescript
   * const items = await anagraficaService.getElenco('employees', '?filter=name eq \'John\'').subcribe();
   * console.log(items);
   * ```
   */
  getElenco($subjectCalled: string, queryString:string):Observable<any> {

    let EndPoint = `${this.apiUrl}${$subjectCalled}`


    if (queryString) {
      EndPoint = `${EndPoint}${queryString}`
    } 


    const HeaderOdata = this.httpOptionCall;

    const response = this.httpClient.get(EndPoint, HeaderOdata)

    return response.pipe(res=>{
      return res
    })

  }


  async getValue(subjectCalled:string, filterKey: any, queryString:string):Promise<any> {

    let filterPath = ''
    if (typeof filterKey != 'undefined') {
      filterPath = filterKey;
    }

    //console.log('filterKey', filterPath)

    let query = queryString ? queryString : ''

    let completeDataSource

    if (subjectCalled.includes('?') || subjectCalled.includes('/')) {

      completeDataSource = subjectCalled + filterPath

    } else {
      if (String(filterKey).includes('/') || String(filterKey).includes('?') && filterPath) {
        completeDataSource = subjectCalled + filterPath
      } else {
        if (filterPath) {
          completeDataSource = subjectCalled + '/' + filterPath
        } else {
          completeDataSource = subjectCalled
        }
      }


    }
    try {
      const EndPoint = environment.BASE_API_URL + completeDataSource + query
      //console.log(EndPoint)
      const HeaderOdata = this.httpOptionCall;

      const response = this.httpClient.get(EndPoint, HeaderOdata);

      return await lastValueFrom(response);

    } catch (error:any) {
            // Se l'errore è di tipo 401 (non autorizzato), ritorna false
      if (error.status === 401) {
        //this.router.navigate(['/login']);
      } 
      
    }
  }

  async actionPut($subjectCalled: string, data: Partial<any>, isKeyid = true) {

    const keyId = !isKeyid ? '' : '/' + data['id']

    const EndPoint = environment.BASE_API_URL + $subjectCalled + keyId;

    const HeaderOdata = this.httpOptionCall;

    const response = this.httpClient.put(EndPoint, data, HeaderOdata)



    ////console.log(response); 

    return await lastValueFrom(response);



  }

  async actionInsert($subjectCalled: any, data: any, test = false) {
    let EndPointT
    
      EndPointT = environment.BASE_API_URL
   
    const EndPoint = EndPointT + $subjectCalled;
    //console.log(data)
    const HeaderOdata = this.httpOptionCall;

    const response = this.httpClient.post(EndPoint, data, HeaderOdata)
    return await lastValueFrom(response);
  }

  actionDelete(subjectCalled: string, dataRefer: string) {
    const EndPoint = environment.BASE_API_URL + subjectCalled + '/' + dataRefer;;
    const HeaderOdata = this.httpOptionCall;
    const response = this.httpClient.delete(EndPoint, HeaderOdata)
    return lastValueFrom(response);
  }

}















