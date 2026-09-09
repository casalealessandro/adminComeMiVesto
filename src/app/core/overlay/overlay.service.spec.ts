import { OverlayService } from './overlay.service';

describe('OverlayService characterization', () => {
  let service: OverlayService;

  beforeEach(() => {
    service = new OverlayService();
  });

  it('forwards the overlay payload and tracks the current overlay index', () => {
    const received: any[] = [];
    const subscription = service.overlayData$.subscribe(value => received.push(value));
    const payload = {
      position: { top: 120, left: 240 },
      contentTemplate: {} as any,
      showBgOverlay: false,
      index: 'profile-menu'
    };

    service.openOverlay(payload);

    expect(service.currentOverlayIndex()).toBe('profile-menu');
    expect(received).toEqual([payload]);
    subscription.unsubscribe();
  });

  it('closes the overlay by emitting null on the shared stream', () => {
    const received: any[] = [];
    const subscription = service.overlayData$.subscribe(value => received.push(value));

    service.openOverlay({
      position: { top: 10, left: 20 },
      contentTemplate: {} as any,
      showBgOverlay: true,
      index: 1
    });
    service.closeOverlay();

    expect(received.length).toBe(2);
    expect(received[1]).toBeNull();
    subscription.unsubscribe();
  });
});
