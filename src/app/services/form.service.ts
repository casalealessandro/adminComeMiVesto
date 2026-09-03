import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { DynamicFormField, normalizeDynamicFormFields } from '../interface/dynamic-form-field';

export interface StoredForm { id: string; nameForm: string; json: DynamicFormField[]; }

export function parseFields(value: unknown): DynamicFormField[] {
  if (Array.isArray(value)) return normalizeDynamicFormFields(value);
  if (typeof value === 'string') {
    try { const parsed = JSON.parse(value); return normalizeDynamicFormFields(Array.isArray(parsed) ? parsed : []); }
    catch { return []; }
  }
  return [];
}

@Injectable({ providedIn: 'root' })
export class FormService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/gen/forms`;

  getForms(): Observable<StoredForm[]> {
    return this.http.get<any>(this.base).pipe(map(response => (response.data || []).map((item: any) => ({ ...item, json: parseFields(item.json) }))));
  }
  getFormById(formId: string): Observable<StoredForm> {
    return this.http.get<any>(`${this.base}/${encodeURIComponent(formId)}`).pipe(map(response => {
      const item = response.data && !Array.isArray(response.data) ? response.data : response;
      return { id: item.id || formId, nameForm: item.nameForm || formId, json: parseFields(item.json ?? response.data) };
    }));
  }
  getFormFields(formId: string): Observable<DynamicFormField[]> { return this.getFormById(formId).pipe(map(form => form.json)); }
  saveForm(formId: string, form: Partial<StoredForm>): Promise<unknown> {
    const json = parseFields(form.json);
    if (formId === 'new' || !form.id) return firstValueFrom(this.http.post(this.base, { id: form.id || formId, nameForm: form.nameForm, json }));
    return firstValueFrom(this.http.put(`${this.base}/${encodeURIComponent(formId)}`, { nameForm: form.nameForm, json }));
  }
  deleteForm(formId: string): Promise<unknown> { return firstValueFrom(this.http.delete(`${this.base}/${encodeURIComponent(formId)}`)); }
  getData(api: string, queryString = ''): Promise<any> { return firstValueFrom(this.http.get(`${environment.apiBaseUrl}/gen/${api}${queryString}`)); }
}
