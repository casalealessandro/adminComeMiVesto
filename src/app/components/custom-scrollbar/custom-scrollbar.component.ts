import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-custom-scrollbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './custom-scrollbar.component.html',
  styleUrl: './custom-scrollbar.component.scss'
})
export class CustomScrollbarComponent {
  @Input() scrollHeigth: number = 400;
  @Output() scrolled = new EventEmitter<Event>();

  onScroll(event: Event): void {
    this.scrolled.emit(event);
  }
}
