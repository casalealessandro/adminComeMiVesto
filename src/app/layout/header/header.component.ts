import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';


@Component({
  selector: 'app-header',
  standalone:true,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})


export class HeaderComponent {
  @Input() toggleMenu!: () => void;
  
  constructor() {}

  ngOnInit() {
    this.renderHeader()
  }


  renderHeader() {
    

  }

 



  

 

  
  

}