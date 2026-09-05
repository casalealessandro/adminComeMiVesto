import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CaptionComponent } from '../../components/caption/caption.component';
import { ToolbarButton } from '../../interface/app.interface';

@Component({
  selector: 'app-anagrafica-wrapper',
  standalone: true,
  imports: [CaptionComponent, CommonModule],
  templateUrl: './anagrafica-wrapper.component.html',
  styleUrls: ['./anagrafica-wrapper.component.scss']
})
export class AnagraficaWrapperComponent {
  @Input() caption: string = '';
  @Input() anaHeight: number = 800;
  @Input() subTitle: string = '';
  @Input() tip: string = '';
  @Input() addButtonShow: boolean = false;
  @Input() showSearchInput: boolean = false;
  @Input() showButtonInput: boolean = false;
  @Input() helpDoc: string = '';
  @Input() breadcrumbNavigation: any = [];
  @Input() showSpinner: boolean = false;
  @Input() cssClass: string = '';
  @Input() customToolbarButtons!: ToolbarButton[];

  @Output() emittChiusura = new EventEmitter<any>();
  @Output() emittEventButton = new EventEmitter<any>();
  @Output() emitEventSearchInput = new EventEmitter<any>();
  @Output() emitEventButtonInputChange = new EventEmitter<any>();

  constructor() {
    this.setAutoDismiss();
  }

  private setAutoDismiss(): void {
    setTimeout(() => {
      this.tip = '';
    }, 60000);
  }

  onCrocettaClick(event: any): void {
    this.emittChiusura.emit(event);
  }

  onAddClick(event: any): void {
    this.emittEventButton.emit(event);
  }

  onButtonToolbarClick(event: any): void {
    this.emittEventButton.emit(event);
  }

  onSearchInputChange(event: any): void {
    this.emitEventSearchInput.emit(event);
  }

  onButtonInputChange(event: any): void {
    this.emitEventButtonInputChange.emit(event);
  }
}
