import { MenuService } from './menu.service';

describe('MenuService E.0 characterization', () => {
  let service: MenuService;

  beforeEach(() => {
    service = new MenuService();
  });

  it('starts closed in both the signal and observable contracts', () => {
    const values: boolean[] = [];
    const subscription = service.getIsMenuOpenObservable.subscribe(value => values.push(value));

    expect(service.isOpenMenu()).toBeFalse();
    expect(service.getIsMenuOpen()).toBeFalse();
    expect(values).toEqual([false]);

    subscription.unsubscribe();
  });

  it('keeps signal and observable in sync when opening and closing', () => {
    const values: boolean[] = [];
    const subscription = service.getIsMenuOpenObservable.subscribe(value => values.push(value));

    service.openMenu();
    expect(service.isOpenMenu()).toBeTrue();
    expect(service.getIsMenuOpen()).toBeTrue();

    service.closeMenu();
    expect(service.isOpenMenu()).toBeFalse();
    expect(service.getIsMenuOpen()).toBeFalse();
    expect(values).toEqual([false, true, false]);

    subscription.unsubscribe();
  });

  it('toggles from the current signal state and publishes the same value', () => {
    const values: boolean[] = [];
    const subscription = service.getIsMenuOpenObservable.subscribe(value => values.push(value));

    service.toggleMenu();
    expect(service.isOpenMenu()).toBeTrue();

    service.toggleMenu();
    expect(service.isOpenMenu()).toBeFalse();
    expect(values).toEqual([false, true, false]);

    subscription.unsubscribe();
  });
});
