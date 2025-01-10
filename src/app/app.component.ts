import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ContainerComponent } from './layout/container/container.component';
import { OverlayComponent } from "./components/overlay-component/overlay.component";
import { PopupWrapperComponent } from "./components/modal-popup/modal-popup-wrapper/modal-popup-wrapper.component";

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
