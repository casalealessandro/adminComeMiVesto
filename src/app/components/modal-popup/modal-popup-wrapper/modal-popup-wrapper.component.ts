import { Component, HostListener, inject, OnInit } from '@angular/core';
import { PopUpService } from '../../../services/popup.service';
import { CommonModule } from '@angular/common';
import { NicaPopupContentComponent } from '../modal-popup-content/modal-popup-content.component';

@Component({
  selector: 'app-modal-popup-wrapper',
  templateUrl: './modal-popup-wrapper.component.html',
  imports: [CommonModule, NicaPopupContentComponent],
  standalone: true,
  styleUrls: ['./modal-popup-wrapper.component.css']
})
export class PopupWrapperComponent implements OnInit {
  popups: any[] = [];
  classe!: string;
  classSlideCenter: string = 'slide-center';
  classFadeIn: string = 'fade-in-fwd';
  popUpService = inject(PopUpService);

  private focusOrigins = new Map<string, HTMLElement | null>();

  ngOnInit() {
    this.popUpService.popupsSet.subscribe(currentSetPopups => {
      currentSetPopups.forEach((res, i) => {
        if (res.action == 'added') {
          this.rememberFocusOrigin(res);
          res.action = 'setted';
          res.class = this.classSlideCenter;
          this.popups.push(res);
          this.focusPopup(res);
        }

        if (res.action == 'update') {
          res.action = 'setted';
          res.class = 'fade-out-bck';
          this.popups.splice(i, 1);
          res.class = this.classSlideCenter;
          setTimeout(() => {
            this.popups.push(res);
          }, 500);
        }

        if (res.action == 'remove') {
          res.class = 'fade-out-bck';
          setTimeout(() => {
            this.popups.splice(i, 1);
            this.restoreFocusOrigin(res);
          }, 300);
        }
      });

      //this.popUpService.setPopUps(this.popups)
    });
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(event: KeyboardEvent) {
    const topPopup = this.popups[this.popups.length - 1];

    if (!topPopup || topPopup.action === 'remove' || !topPopup.isClosable) {
      return;
    }

    event.preventDefault();

    if (topPopup.id) {
      this.popUpService.destroyCurrentOpenPopUpByGuid(topPopup.id);
    } else {
      this.popUpService.destroyCurrentOpenPopUp(topPopup.componentName);
    }

    this.popUpService.setOutputComponent({ guid: topPopup.id, name: 'stochiudendo' });
    this.popUpService.destroyOutputComponent();
  }

  private rememberFocusOrigin(popup: any) {
    if (!popup?.id || this.focusOrigins.has(String(popup.id))) {
      return;
    }

    const activeElement = document.activeElement;
    this.focusOrigins.set(
      String(popup.id),
      activeElement instanceof HTMLElement ? activeElement : null
    );
  }

  private focusPopup(popup: any) {
    if (!popup?.id) {
      return;
    }

    setTimeout(() => {
      const popupElement = document.getElementById(String(popup.id));
      popupElement?.focus();
    });
  }

  private restoreFocusOrigin(popup: any) {
    if (!popup?.id) {
      return;
    }

    const key = String(popup.id);
    const focusOrigin = this.focusOrigins.get(key);
    this.focusOrigins.delete(key);

    if (focusOrigin?.isConnected) {
      focusOrigin.focus();
    }
  }
}
