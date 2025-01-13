import { Component, inject } from '@angular/core';
import { DynamicFormComponent } from '../../components/dynamic-form/dynamic-form.component';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';
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
  constructor(private usersService: UserService, private router: Router){


  }


  async login(evt:any){
    
    const data = evt.formData
    const loginResp = await this.usersService.loginUser(data);

    if(loginResp){
       
      this.router.navigate(['dashboard'])
    }
  }
}
