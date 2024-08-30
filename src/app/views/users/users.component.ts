import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AnagraficaWrapperComponent } from '../../layout/anagrafica-wrapper/anagrafica-wrapper.component';
import { UserProfile } from '../../interface/app.interface';
import { UserService } from '../../services/user.service';
import { Observable } from 'rxjs';
import { alert } from '../../widgets/ui-dialogs';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule,AnagraficaWrapperComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent {

// Lista degli utenti e utente selezionato
users$: Observable<UserProfile[]> | undefined;

selectedUser: UserProfile | undefined;
users!: UserProfile[];  

private userService=inject(UserService)
subtitle: string = `Elenco utenti registrati in app`;

ngOnInit(){
  // Carica gli utenti dalla collezione 'users' di Firestore
  this.users$ = this.userService.getUsers();
  this.users$.subscribe(users=>{
      this.users = users
  })
}


deleteUser(arg0: any) {
  throw new Error('Method not implemented.');
}
 

editUser(_t11: any) {
  throw new Error('Method not implemented.');
}

createNewuser() {
  throw new Error('Method not implemented.');
}

async sendPasswordReset(user: UserProfile): Promise<void> {
 
    let ress = await this.userService.sendPasswordFirebase(user.email);
    if(ress){

      alert(`Email di reset inviata a ${user.email}`,'Attenzione!');
      
    }
  
}

disableUser(uid: string) {

  this.userService.disabledUsersFirebase(uid)
  throw new Error('Method not implemented.');
}

}
