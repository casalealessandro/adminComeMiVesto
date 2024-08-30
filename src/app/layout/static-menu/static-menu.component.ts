import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { environment } from '../../../environments/environment';
import { NicaMenuService } from '../../services/nica-menu.service';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-static-menu',
  templateUrl: './static-menu.component.html',
  styleUrls: ['./static-menu.component.css']
})
export class StaticMenuComponent implements OnInit {


  @Input() isClose = false
  @Output() emittendItemMenu: EventEmitter<any> = new EventEmitter<any>(); //Emit all'esterno
  @Output() closeMainMenu: EventEmitter<any> = new EventEmitter<any>(); //Emit all'esterno

  
  nomeCompleto;
  tipoUtente;
  foto;
  licenza;
  descr_licenza: string;
  macroMenu
  setActive:boolean[] =[false];
  setFirstShow:boolean;
  
  constructor(
    private menuService: NicaMenuService,
    public utenteService: UserService,
    private router: Router
  ) { }

  ngOnInit() {
    
    
    this.menuService.getMenu().then(res => {
      
      this.macroMenu = res;
      this.initializzed();
      this.mainMenuClick(this.macroMenu[0])

      if(this.router.url.split('?')[0] != 'nica-dashboard'){
       this.hideShowMainMenu();
      }
      //setta menu in base ai permessi -----------
      
      //this.utenteService.settaMenuInBaseAiPermessi(res);
      
    });

   this.nomeCompleto = this.utenteService.InfoUtenteConnesso.nomeCompleto;
   this.tipoUtente = this.utenteService.InfoUtenteConnesso.tipoutente;
   this.licenza = this.utenteService.InfoUtenteConnesso.licenza;
   this.descr_licenza = this.utenteService.InfoUtenteConnesso.descr_licenza;
   
   this.foto = this.utenteService.InfoUtenteConnesso.foto ? environment.BASE_PUBLIC_IMAGE + this.utenteService.InfoUtenteConnesso.foto : 'assets/images/img_avatar2.png?timestamp=1687875127711'
  
    /*
    document.getElementById('immagineProfiloSideMenu').onmouseover = () => {
      
      (document.getElementById('immagineProfiloSideMenu') as HTMLImageElement).src = "assets/icons/MODIFICA PROFILO GIALLO.svg";
    
      
      
    }

    document.getElementById('immagineProfiloSideMenu').onmouseleave = () => {
      (document.getElementById('immagineProfiloSideMenu') as HTMLImageElement).src = this.foto;
     
    }
    */
    

  }


  mainMenuClick(ev){

    this.setActive=[];
    let dataTosend = {
      mainMenuData: ev,
      items:ev['items'][0]['items']
    }
    
    this.emittendItemMenu.emit(dataTosend)
    this.setActive[ev.id] = true;
    this.setFirstShow = true;
    if(!this.setFirstShow){
     
      this.hideShowMainMenu();
      
    }
  }

  initializzed() {
   
    this.menuService.setVariabili(this.macroMenu);
  }

  hideShowMainMenu(e?){
    this.closeMainMenu.emit(e);
  }
}
