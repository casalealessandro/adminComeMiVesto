import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { SCROLL_INTERACTION_POLICY } from './scroll-interaction-policy';

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

  private readonly interactionPolicy = inject(SCROLL_INTERACTION_POLICY, { optional: true });

  onScroll(event: Event): void {
    this.scrolled.emit(event);
    this.interactionPolicy?.onScroll(event);
  }
}
