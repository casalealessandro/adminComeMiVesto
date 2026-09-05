import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { PopUpService } from '../../../services/popup.service';
import { PopupContentComponent, PopupInfo } from '../modal-popup-content/modal-popup-content.component';

@Component({
  selector: 'app-modal-popup-wrapper',
  standalone: true,
  imports: [CommonModule, PopupContentComponent],
  templateUrl: './modal-popup-wrapper.component.html'
})
export class PopupWrapperComponent implements OnInit, OnDestroy {
  popups: PopupInfo[] = [];
  private subscription?: Subscription;

  constructor(private readonly popUpService: PopUpService) {}

  ngOnInit(): void {
    this.subscription = this.popUpService.popupsSet.subscribe(currentPopups => {
      this.popups = currentPopups.map(popup => ({
        ...popup,
        class: popup.action === 'remove' ? 'fade-out-bck' : 'slide-center'
      }));
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
