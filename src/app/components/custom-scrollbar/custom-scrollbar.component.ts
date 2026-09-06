import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
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
  @Output() scrollEvent: EventEmitter<Event> = new EventEmitter<Event>();
  overlayService= inject(OverlayService)  
  onScroll(event: Event): void {
    this.overlayService.closeOverlay()
    this.scrollEvent.emit(event)
  }
}
