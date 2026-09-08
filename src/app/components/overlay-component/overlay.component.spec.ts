import { ElementRef } from '@angular/core';
import { fakeAsync, tick } from '@angular/core/testing';
import { OverlayComponent } from './overlay.component';
import { OverlayService } from '../../services/overlay.service';

describe('OverlayComponent characterization', () => {
  let service: OverlayService;
  let component: OverlayComponent;
  let overlayElement: HTMLDivElement;

  beforeEach(() => {
    service = new OverlayService();
    component = new OverlayComponent(service);
    overlayElement = document.createElement('div');
    component.overlayContentRef = new ElementRef(overlayElement);
    component.ngOnInit();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('opens with the position, template and backdrop flag received from the service', fakeAsync(() => {
    const template = {} as any;

    service.openOverlay({
      position: { top: 100, left: 200 },
      contentTemplate: template,
      showBgOverlay: false,
      index: 'profile-menu'
    });

    expect(component.isVisible()).toBeTrue();
    expect(component.position()).toEqual({ top: 100, left: 200 });
    expect(component.contentTemplate).toBe(template);
    expect(component.showBgOverlay).toBeFalse();

    tick(10);
    expect(overlayElement.classList.contains('active')).toBeTrue();
  }));

  it('hides when the service emits a close event', () => {
    service.openOverlay({
      position: { top: 10, left: 20 },
      contentTemplate: {} as any,
      showBgOverlay: true,
      index: 1
    });
    expect(component.isVisible()).toBeTrue();

    service.closeOverlay();

    expect(component.isVisible()).toBeFalse();
  });

  it('closes immediately when a document click occurs outside the visible overlay', () => {
    const closeSpy = spyOn(component, 'closeOverlay');
    const outsideElement = document.createElement('button');
    component.isVisible.set(true);

    component.clickOutside({ target: outsideElement } as any);

    expect(closeSpy).toHaveBeenCalledTimes(1);
  });

  it('does not close when the document click occurs inside the overlay', () => {
    const closeSpy = spyOn(component, 'closeOverlay');
    const insideElement = document.createElement('button');
    overlayElement.appendChild(insideElement);
    component.isVisible.set(true);

    component.clickOutside({ target: insideElement } as any);

    expect(closeSpy).not.toHaveBeenCalled();
  });

  it('delegates component close to the service after the historical animation delay and emits closed', fakeAsync(() => {
    const closeSpy = spyOn(service, 'closeOverlay').and.callThrough();
    const closedSpy = jasmine.createSpy('closed');
    component.closed.subscribe(closedSpy);

    service.openOverlay({
      position: { top: 10, left: 20 },
      contentTemplate: {} as any,
      showBgOverlay: false,
      index: 1
    });

    tick(10);
    component.closeOverlay();
    expect(closeSpy).not.toHaveBeenCalled();
    expect(overlayElement.classList.contains('active')).toBeFalse();

    tick(200);
    expect(closeSpy).toHaveBeenCalled();
    expect(component.isVisible()).toBeFalse();
    expect(closedSpy).toHaveBeenCalledTimes(1);
  }));
});
