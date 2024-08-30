import { Component, Input, OnInit } from '@angular/core';



;

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    standalone:true,
    styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {

    
    dateCopy!: Date;
    infoAziendaFooter: any;

    constructor() { }

    ngOnInit() {

        this.dateCopy = new Date();


        



        //console.log(this.utenteService.InfoUtenteConnesso)
    }
}
