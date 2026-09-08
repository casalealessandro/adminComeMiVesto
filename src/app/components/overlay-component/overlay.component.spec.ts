import { fakeAsync, tick } from '@angular/core/testing';
import { OverlayComponent } from './overlay.component';
import { OverlayService } from '../../services/overlay.service';

describe('OverlayComponent characterization', () => {
  let service: OverlayService;
  let component: OverlayComponent;

  beforeEach(() => {
    service = new OverlayService();
    component = new OverlayComponent(service);
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

  it('delegates component close to the service after the historical animation delay', fakeAsync(() => {
    const closeSpy = spyOn(service, 'closeOverlay').and.callThrough();
    service.openOverlay({
      position: { top: 10, left: 20 },
      contentTemplate: {} as any,
      showBgOverlay: false,
      index: 1
    });

    component.closeOverlay();
    expect(closeSpy).not.toHaveBeenCalled();

    tick(200);
    expect(closeSpy).toHaveBeenCalled();
    expect(component.isVisible()).toBeFalse();
  }));
});
