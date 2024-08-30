import { Component, inject } from '@angular/core';

import { Router } from '@angular/router';
import { AnagraficaWrapperComponent } from "../../layout/anagrafica-wrapper/anagrafica-wrapper.component";
import { CommonModule } from '@angular/common';
import { FormService } from '../../services/form.service';
import { confirm } from '../../widgets/ui-dialogs';

@Component({
  selector: 'app-form-list',
  standalone: true,
  imports: [CommonModule,AnagraficaWrapperComponent],
  templateUrl: './app-form-list.component.html',
  styleUrl: './app-form-list.component.scss'
})
export class AppFormListComponent {
  forms: any[] = [];
  formService=inject(FormService)
  constructor(private router: Router) {}

  ngOnInit() {
    this.loadForms();
  }

  loadForms() {
    this.formService.getForms().subscribe((data: any[]) => {
      this.forms = data
    });
  }

  createNewForm() {
    this.router.navigate(['/form-builder', 'new']);
  }

  editForm(form: any) {
    this.router.navigate(['/form-builder', form.nameForm]);
  }

  deleteForm(formId: string) {
    confirm('Sei sicuro di voler elimare la form?','Attenzione!',res=>{
      if(res){
        this.formService.deleteForm(formId).then(() => {
          
        }).catch((err:any) => {
          console.error('Errore durante l\'eliminazione del form:', err);
        });
      }
    })

    
  }

}
