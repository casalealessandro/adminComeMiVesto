import { Component, EventEmitter, Input, Output, output } from '@angular/core';
import { Router } from '@angular/router';
import { MenuService } from '../../services/menu.service';

@Component({
  selector: 'app-header',
  standalone:true,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})


export class HeaderComponent {
  @Output() toggleMenu = new EventEmitter<void>();
  
  constructor(private menuService: MenuService) {}

  ngOnInit() {
    this.renderHeader()
  }
  renderHeader() {
  }
  onToggleMenu() {
    this.menuService.toggleMenu(); 
  }
}