import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { OverlayService } from '../../services/overlay.service';


@Component({
  selector: 'app-custom-scrollbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './custom-scrollbar.component.html',
  styleUrl: './custom-scrollbar.component.scss'
})

export class CustomScrollbarComponent {
  @Input() scrollHeigth: number = 400;
  overlayService= inject(OverlayService)  
  onScroll(event: any): void {
    this.overlayService.closeOverlay()
  }
}
