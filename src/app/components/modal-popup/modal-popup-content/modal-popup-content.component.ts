import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { CaptionComponent } from '../../caption/caption.component';
import { PopupInfo } from '../../../core/popup/popup.models';
import { PopUpService } from '../../../services/popup.service';

@Component({
  selector: 'app-modal-popup-content',
  standalone: true,
  imports: [CaptionComponent, CommonModule],
  templateUrl: './modal-popup-content.component.html',
  styleUrls: ['./modal-popup-content.component.scss']
})
export class PopupContentComponent implements OnInit {
  @Input({ required: true }) infoPopup!: PopupInfo;

  @ViewChild('containerComponent', { static: true, read: ViewContainerRef })
  containerComponent!: ViewContainerRef;

  isPanelVisible = false;
  zIndexModalDialog = 500;

  constructor(private readonly popUpService: PopUpService) {}

  ngOnInit(): void {
    this.isPanelVisible = true;
    this.zIndexModalDialog = this.getMaxZIndex() + 1;
    this.mountComponent();
  }

  get popupWidth(): string {
    const width = this.infoPopup.popUpWidth;
    if (width === undefined || width === null || width === '') return '';
    if (typeof width === 'number') return `${width}px`;
    return width.endsWith('px') || width.endsWith('vw') || width.endsWith('%') ? width : `${width}px`;
  }

  close(): void {
    if (this.infoPopup.id) {
      this.popUpService.destroyCurrentOpenPopUpByGuid(this.infoPopup.id);
    } else {
      this.popUpService.destroyCurrentOpenPopUp(this.infoPopup.componentName);
    }

    this.popUpService.setOutputComponent({
      guid: this.infoPopup.id,
      name: 'stochiudendo'
    });
  }

  private mountComponent(): void {
    const componentType = this.popUpService.getComponentByName(this.infoPopup.componentName);
    if (!componentType) return;

    const componentRef = this.containerComponent.createComponent(componentType);
    const instance = componentRef.instance as Record<string, any>;

    instance['itemData'] = this.infoPopup.dataToSend;
    instance['cssClass'] = 'modal-content';

    Object.entries(this.infoPopup.instancedData ?? {}).forEach(([key, value]) => {
      instance[key] = value;
    });

    Object.entries(instance).forEach(([eventName, value]) => {
      if (!(value instanceof EventEmitter)) return;

      value.subscribe((payload: any) => {
        const eventPayload = typeof payload === 'boolean'
          ? { name: eventName }
          : { ...(payload ?? {}) };

        eventPayload.componentName = this.infoPopup.componentName;
        eventPayload.accessoringData = this.infoPopup.accessoringData;
        eventPayload.guid = this.infoPopup.id;
        eventPayload.name ??= eventName;

        this.popUpService.setOutputComponent(eventPayload);
      });
    });
  }

  private getMaxZIndex(): number {
    const values = Array.from(document.querySelectorAll<HTMLElement>('.modal'))
      .filter(element => !element.classList.contains('modal-dialog'))
      .map(element => Number.parseFloat(window.getComputedStyle(element).zIndex))
      .filter(Number.isFinite);

    return values.length ? Math.max(...values) : 499;
  }
}
