import { Component, inject } from '@angular/core';
import { DynamicFormComponent } from '../../components/dynamic-form/dynamic-form.component';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { AnagraficaWrapperComponent } from "../../layout/anagrafica-wrapper/anagrafica-wrapper.component";
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [DynamicFormComponent, CommonModule, AnagraficaWrapperComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  errorMessage = '';
  loading = false;
  constructor(private auth: AuthService, private router: Router){


  }


  async login(evt:any){
    
    const data = evt.formData
    this.loading = true;
    this.errorMessage = '';
    try {
      const access = await this.auth.login(data.email, data.password);
      await this.router.navigate([access.canAccessBackoffice ? '/dashboard' : '/access-denied']);
    } catch { this.errorMessage = 'Credenziali non valide o servizio non disponibile.'; }
    finally { this.loading = false; }
  }
}
