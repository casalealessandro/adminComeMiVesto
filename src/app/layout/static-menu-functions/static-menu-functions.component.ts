import { Component, EventEmitter, Input, OnInit, Output, Pipe } from '@angular/core';

import { Router } from '@angular/router';

import { UserService } from '../../services/user.service';
import { alert } from '../../widgets/ui-dialogs';





@Component({
  selector: 'app-static-menu-functions',
  templateUrl: './static-menu-functions.component.html',
  styleUrls: ['./static-menu-functions.component.css']
})
export class StaticMenuFunctionsComponent{
  @Input() subMenu
  @Input() currentMainMenuActive;
  @Output() emittendItemFunctionMenu: EventEmitter<any> = new EventEmitter<any>(); //Emit all'esterno
  constructor(private ruote: Router, private utente: UserService) { }
  menu;

  ngOnInit() {
    //console.log('currentMainMenuActive', this.currentMainMenuActive)
  }

  clickItemFunction(ev) {

    const itemData = ev;



    if (itemData.controller == '') {
      alert('Nessun componente attivo', 'Messaggio')
      return
    }

    if (itemData.controller == 'Causali2Component') {

      itemData.controller = 'EditAutocompleteComponent';
      ev.itemData.controller = 'EditAutocompleteComponent';
      //return
    }



    /* Con ruote*/
    let valueC
    let dataFilter ={};
    let titolo = ''
    let api
    let service
    let breadcrumb
    let template = 'grid'
    let controller
    let descEvent = ''
    //alert(itemData.controller,"www")
    if (itemData.controller == 'Causali2Component') itemData.controller = 'EditAutocompleteComponent';
    switch (itemData.id) {

      case '087':
        api = 'CausaleRifiuti';
        service = 'CausaliRifiuti'
        titolo = 'Causali';
        breadcrumb = 'Causali';
        template = "grid";

        break;
      case '086':
        api = 'RegistroRifiuti';
        service = 'registroRifiuti'
        titolo = 'RegistroRifiuti';
        breadcrumb = 'RegistroRifiuti';
        template = "grid";

        break;

      case '085':
        api = 'soggetto';
        service = 'soggetti'
        titolo = 'Anagrafiche propri impianti';
        breadcrumb = 'Anagrafica azienda'
        controller = 'AnaSoggettoComponent'
        descEvent = ''
        template = "grid";
        valueC =
        {
          NostreAziende: 'S'
        }

        dataFilter = {
          nsAzienda: true,
          NostreAziende: 'S'
        }
        break;
      case '043':
        api = 'soggetto';
        service = 'soggetti';
        titolo = 'Anagrafiche azienda';
        breadcrumb = 'Anagrafica azienda';
        template = "grid";
        descEvent = ''
        valueC =
        {
          NostreAziende: 'N',

        }
        dataFilter = {
          nsAzienda: false,
          NostreAziende: 'N',
        }
        break;
      case '044':
        api = 'soggetto';
        service = 'soggetti';
        template = "grid",
          descEvent = ''
        valueC =
        {
          NostreAziende: 'N',

        }
        dataFilter = {
          nsAzienda: false,
          NostreAziende: 'N',
        }
        break;
      case '045':
        api = 'soggetto';
        service = 'soggetti';
        template = "grid",
        descEvent = ''
        valueC =
        {
          NostreAziende: 'N',

        }
        dataFilter = {
          nsAzienda: false,
          NostreAziende: 'N',
        }
        break;
      case '125': // Schede rifiuti Produttori        


        titolo = 'Schede descrittive rifiuti';
        service = 'SchedaRifiutoN';
        api = 'SchedaRifiuto';
        template = "grid";


        break;
      case '126': // Schede rifiuti Produttori        

        titolo = 'Schede descrittive rifiuti';
        service = 'SchedaRifiuto';
        api = 'SchedaRifiuto';
        template = "grid";


        break;

      case '200':
        api = '';
        service = 'gestioneAziendaAdmin'
        titolo = 'Gestione info Azienda';
        breadcrumb = 'Info azienda';
        template = "form";
        valueC =
        {
          idLicenza: this.utente.InfoUtenteConnesso.licenza,
        }
        dataFilter = {
          titolo: 'Gestione Utenti e Permessi',
          idLicenza: this.utente.InfoUtenteConnesso.licenza
        }
        break;
      case '122': {
        api = 'ConfigurazioniModuli';
        service = 'ConfigurazioniModuli';
        template = "grid"
        break;
      }
      case '090': {
        api = 'MovimentoRifiuti';
        service = 'movimentiRifiuto';
        template = "grid"
        break;
      }

      case '204': {
        api = 'DocumentoRifiuti';
        service = 'movimentiRifiuto';
        template = "grid",
        breadcrumb = 'Formulari emessi'
        break;
      }
      case '206': {

        titolo = 'Stampa Registri di Carico e Scarico Aziendale';

        service = 'stampaRegistriFiltri';
        template = "form";
        break;
      }

      case '207': {

        titolo = 'Generatore di anagrafiche';
         service = 'newAnagrafica';
         template = "grid";
        /*api = 'ModelloDiStampa';
        template = "grid"; */
        break;
      }
      case '208': {

        titolo = 'Giacenze rifiuti';
        service = 'GiacenzeRifiuti';
        api = '';
        template = "form";
        break;
      }
        /*
        case '804':{
  
          titolo='Anagrafica Registri di C/S Rifiuti';
          service = 'anaRegistroRifiuti';
          api = 'RegistroRifiuti';
          template="grid";
          controller= 'AnaRegistroRifiutiComponent';
  
        }*/
        break;

    }

    if (typeof itemData.text == 'undefined') {
      return
    }

    let pathItem = itemData.text.toLowerCase().replace(/[^a-zA-Z ]/g, '');
    pathItem = pathItem.replace(/\s/g, '-');

    //dataFilter.isJustClose = true

    let params = {

      api: api,
      service: service,
      titolo: titolo != '' ? titolo : itemData.text,
      breadcrumb: breadcrumb,
      currentTabId: itemData.id,
      currentTabName: itemData.text,
      queryFilter: JSON.stringify(valueC),
      data: JSON.stringify(dataFilter),
      filter: JSON.stringify(dataFilter),
      helpDoc: itemData.contextHelp,
      componentName: controller,
      templateView: template,
      descEvent: descEvent
    }

    let perm=this.utente.DammiPermessiFunzione(params.currentTabId);
    if(perm=='' || perm=='S'){
      alert("Non hai permessi per accedere alla funzione",'Permessi')
      return;
    }
 //currentTabId:"087"


    //console.log(params)
    this.ruote.navigate(
      ['/' + pathItem],
      {
        queryParams: params,
        skipLocationChange: false,
        replaceUrl: true,
      }
    )
      .then(data => {

        this.emittendItemFunctionMenu.emit(ev);


      })
      .catch(e => {
        alert(e, '')
        //console.log('Route non exists, redirection is error');
        //this.ruote.navigate(['main/dashboard'])
      });



  }

  hideShowMainMenu(e) {
    e.name = 'closeFromButton';

    this.emittendItemFunctionMenu.emit(e);
  }
}
