import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-caption',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './caption.component.html',
  styleUrls: ['./caption.component.scss']
})
export class CaptionComponent {
  @Input() caption = '';
  @Input() cssClass = '';
  @Input() isClosable = false;
  @Input() addButtonShow = false;

  @Output() emitChiusura = new EventEmitter<void>();
  @Output() emitAddEvent = new EventEmitter<void>();

  close(): void {
    this.emitChiusura.emit();
  }

  add(): void {
    this.emitAddEvent.emit();
  }
}
