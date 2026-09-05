import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CaptionComponent } from '../../components/caption/caption.component';

@Component({
  selector: 'app-anagrafica-wrapper',
  standalone: true,
  imports: [CommonModule, CaptionComponent],
  templateUrl: './anagrafica-wrapper.component.html',
  styleUrls: ['./anagrafica-wrapper.component.scss']
})
export class AnagraficaWrapperComponent {
  @Input() caption = '';
  @Input() subTitle = '';
  @Input() tip = '';
  @Input() addButtonShow = false;
  @Input() showSpinner = false;
  @Input() cssClass = '';

  @Output() emittEventButton = new EventEmitter<void>();

  onAddClick(): void {
    this.emittEventButton.emit();
  }
}
