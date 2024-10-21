import { Component, EventEmitter, Input, Output, output } from '@angular/core';
import { Router } from '@angular/router';


@Component({
  selector: 'app-header',
  standalone:true,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})


export class HeaderComponent {
  @Output() showHidemMenu:EventEmitter<any> = new EventEmitter<any>();
  
  constructor() {}

  ngOnInit() {
    this.renderHeader()
  }


  renderHeader() {
    

  }

 



  toggleMenu(event:Event){
    this.showHidemMenu.emit(event)
  }

 

  
  

}