import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-access-denied',
  template: `<main class="access-denied"><span class="mdi mdi-shield-lock-outline"></span><h1>Accesso negato</h1><p>Non disponi dei permessi necessari per accedere al pannello amministrativo.</p><button class="btn btn-primary" (click)="logout()">Esci</button></main>`,
  styles: [`.access-denied{max-width:42rem;margin:10vh auto;padding:2rem;text-align:center}.mdi{font-size:4rem}.btn{min-height:44px}`]
})
export class AccessDeniedComponent { private auth = inject(AuthService); logout(): void { void this.auth.logout(); } }
