import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
export interface Report { id:string; status?:string; reason?:string; description?:string; userId?:string; outfitId?:string; createdAt?:string|number; [key:string]:unknown; }
@Injectable({providedIn:'root'}) export class ReportService {
  private http=inject(HttpClient); private base=`${environment.apiBaseUrl}/gen/reports`;
  list():Observable<Report[]>{return this.http.get<any>(this.base).pipe(map(r=>r.data||r||[]))}
  detail(id:string):Observable<Report>{return this.http.get<any>(`${this.base}/${encodeURIComponent(id)}`).pipe(map(r=>r.data||r))}
  update(id:string,status:string):Observable<unknown>{return this.http.put(`${this.base}/${encodeURIComponent(id)}`,{status})}
  delete(id:string):Observable<unknown>{return this.http.delete(`${this.base}/${encodeURIComponent(id)}`)}
}
