import { Injectable, Type } from '@angular/core';
import { BehaviorSubject, filter, firstValueFrom } from 'rxjs';
import { POPUP_COMPONENT_REGISTRY } from '../core/popup/popup-component-registry';
import { PopupInfo, PopupOutputEvent } from '../core/popup/popup.models';

@Injectable({ providedIn: 'root' })
export class PopUpService {
  private readonly popupsSubject = new BehaviorSubject<PopupInfo[]>([]);
  readonly popupsSet = this.popupsSubject.asObservable();

  private readonly outputComponentSubject = new BehaviorSubject<PopupOutputEvent>({});
  readonly outputComponent = this.outputComponentSubject.asObservable();

  private currentPopups: PopupInfo[] = [];

  getComponentByName(componentName: string): Type<unknown> | null {
    return POPUP_COMPONENT_REGISTRY.find(item => item.name === componentName)?.component ?? null;
  }

  setNewPopUp(
    id: string,
    componentName: string,
    data: unknown,
    popUpWidth: string | number = '800',
    accessoringData?: unknown,
    instancedData?: Record<string, unknown>,
    showCaptionFooter = false,
    showCaptionHeader = false,
    title = '',
    position = 'center',
    isClosablePopUp = false
  ): void {
    if (typeof window !== 'undefined' && window.innerWidth <= 600) {
      popUpWidth = '100vw';
    }

    const popupId = id || Math.random().toString().replace('0.', '');
    if (!componentName || !popupId) return;

    const index = this.currentPopups.findIndex(
      popup => popup.id === popupId && popup.componentName === componentName
    );

    const popup: PopupInfo = {
      id: popupId,
      componentName,
      dataToSend: data,
      instancedData,
      popUpWidth,
      showCaptionFooter,
      showCaptionHeader,
      accessoringData,
      action: index < 0 ? 'added' : 'update',
      title,
      position,
      isClosablePopUp
    };

    if (index < 0) {
      this.currentPopups = [...this.currentPopups, popup];
    } else {
      this.currentPopups = this.currentPopups.map((current, currentIndex) =>
        currentIndex === index ? { ...current, ...popup } : current
      );
    }

    this.emitPopups();
  }

  destroyCurrentOpenPopUp(componentName: string): void {
    const popup = this.currentPopups.find(item => item.componentName === componentName);
    if (!popup) return;

    this.markForRemoval(popup.id);
    setTimeout(() => this.removePopup(popup.id), 300);
  }

  destroyCurrentOpenPopUpByGuid(id: string): boolean {
    const popup = this.currentPopups.find(item => item.id === id || item.componentName === id);
    if (!popup) return false;

    this.markForRemoval(popup.id);
    this.removePopup(popup.id);
    return true;
  }

  destroyCurrentOpenPopUps(): void {
    this.currentPopups = [];
    this.emitPopups();
  }

  setOutputComponent(event: PopupOutputEvent): void {
    this.outputComponentSubject.next(event);
  }

  destroyOutputComponent(): void {
    this.outputComponentSubject.next({});
  }

  getOutputComponent(guid: string): Promise<PopupOutputEvent> {
    return firstValueFrom(
      this.outputComponent.pipe(filter(event => event.guid === guid))
    );
  }

  private markForRemoval(id: string): void {
    this.currentPopups = this.currentPopups.map(popup =>
      popup.id === id ? { ...popup, action: 'remove' } : popup
    );
    this.emitPopups();
  }

  private removePopup(id: string): void {
    this.currentPopups = this.currentPopups.filter(popup => popup.id !== id);
    this.emitPopups();
  }

  private emitPopups(): void {
    this.popupsSubject.next([...this.currentPopups]);
  }
}
