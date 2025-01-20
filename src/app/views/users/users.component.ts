import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AnagraficaWrapperComponent } from '../../layout/anagrafica-wrapper/anagrafica-wrapper.component';
import { UserProfile } from '../../interface/app.interface';
import { UserService } from '../../services/user.service';
import { Observable } from 'rxjs';
import { alert } from '../../widgets/ui-dialogs';
import { DynamicFormComponent } from '../../components/dynamic-form/dynamic-form.component';
import { PopUpService } from '../../services/popup.service';
import { TimestampToDatePipe } from '../../pipes/timestamp-to-date.pipe';
import { CustomScrollbarComponent } from '../../components/custom-scrollbar/custom-scrollbar.component';



@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AnagraficaWrapperComponent,
    TimestampToDatePipe,
    CustomScrollbarComponent
],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent {

// Lista degli utenti e utente selezionato
users$: Observable<UserProfile[]> | undefined;

selectedUser: UserProfile | undefined;

subtitle: string = `Elenco utenti registrati in app`;
users!: UserProfile[];  

private userService=inject(UserService)
propertiesModal= inject ( PopUpService ); 


ngOnInit(){
  // Carica gli utenti dalla collezione 'users' di Firestore
  this.users$ = this.userService.getUsers();
  this.users$.subscribe(users=>{
      this.users = users
  })
}


async deleteUser(uid: any) {
  console.log('deleteUser-->',this.users)
  let respo = await this.userService.deleteUsersFirebase(uid)
  if(respo){

  }
}
 

editUser(user: UserProfile) {
  this.selectedUser = user;
  
  let guid = Math.random().toString().replace("0.", "");
    let InstanceData = {
      service:'profileForm',
      editData:this.selectedUser
    }
    
    this.propertiesModal.setNewPopUp(guid, 'DynamicFormComponent', null, 800, null, InstanceData, false, true, "Modifica Utente",'',false)
    

    this.propertiesModal.outputComponent.subscribe(resulOutputComponent=>{
      if(resulOutputComponent.guid == guid && resulOutputComponent.name == 'submitForm'){
        
       
      }

      if(resulOutputComponent.guid == guid && resulOutputComponent.name == 'cancelForm'){
        this.selectedUser = undefined
        this.propertiesModal.destroyCurrentOpenPopUpByGuid(guid);
      }
    })
}

createNewuser(event:any) {
  
  

  let guid = Math.random().toString().replace("0.", "");
      let InstanceData = {
        service:'testRegistrazione'
      }
      
      this.propertiesModal.setNewPopUp(guid, 'DynamicFormComponent', null, 800, null, InstanceData, false, true, "Modifica Outfit",'',false)
      
  
      this.propertiesModal.outputComponent.subscribe(async resulOutputComponent=>{
        if(resulOutputComponent.guid == guid && resulOutputComponent.name == 'submitForm'){
           
        }
  
        if(resulOutputComponent.guid == guid && resulOutputComponent.name == 'cancelForm'){
        
        }
      })
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
updateUser(evt:any){

}

filterUsers($event: any) {
  this.users$ = this.userService.getUsers();
  this.users$.subscribe(users=>{
  this.users = users
  const value = $event;
    if (!value) {
      return;
    }
  const filterUser = this.users.filter(user => {
      return user.email.toLowerCase().includes(value.toLowerCase()) ||
             user.displayName.toLowerCase().includes(value.toLowerCase());
        })
        console.log('USER filter',filterUser );
        console.log('USER ', this.users)
        
        this.users = filterUser;
    })
  
  }
  
}
