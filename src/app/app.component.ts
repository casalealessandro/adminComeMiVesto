import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ContainerComponent } from './core/layout/container/container.component';
import { OverlayComponent } from './core/overlay/overlay.component';
import { PopupWrapperComponent } from './core/popup/modal-popup/modal-popup-wrapper/modal-popup-wrapper.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ContainerComponent, OverlayComponent, PopupWrapperComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.sass'
})
export class AppComponent {
  title = 'Admin';
}
