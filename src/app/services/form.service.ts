import { inject, Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { map, Observable } from 'rxjs';
import { DynamicFormField } from '../interface/dynamic-form-field';

@Injectable({
  providedIn: 'root'
})
export class FormService {

  constructor() {}
  private firestore= inject(AngularFirestore);

  getFormFields(nomeAnagrafica: string): Observable<DynamicFormField[]> {
    return this.firestore.collection('forms').doc(nomeAnagrafica).valueChanges()
      .pipe(
        map((formData: any) => {
          const jsonFields = JSON.parse(formData.json);
          return jsonFields as DynamicFormField[];
        })
      );
  }
  // Salva un form
  saveForm(formId: string, formData: any): Promise<void> {
    return this.firestore.collection('forms').doc(formId).set(formData);
  }

  // Ottieni l'elenco dei form
  getForms(): Observable<any[]> {
    return this.firestore.collection('forms').valueChanges()
    .pipe(

      map((forms: any) => {
        return forms
       
      })
    );
  }

  // Ottieni un form specifico per ID
  getFormById(formId: string): Observable<any> {
    return this.firestore.collection('forms').doc(formId).valueChanges();
  }

  // Elimina un form
  deleteForm(formId: string): Promise<void> {
    return this.firestore.collection('forms').doc(formId).delete();
  }
}
