import { MenuService } from './menu.service';

describe('MenuService E.1 single state', () => {
  let service: MenuService;

  beforeEach(() => {
    service = new MenuService();
  });

  it('starts closed from the single signal state', () => {
    expect(service.isOpenMenu()).toBeFalse();
    expect(service.getIsMenuOpen()).toBeFalse();
  });

  it('opens and closes the menu from the same signal state', () => {
    service.openMenu();
    expect(service.isOpenMenu()).toBeTrue();
    expect(service.getIsMenuOpen()).toBeTrue();

    service.closeMenu();
    expect(service.isOpenMenu()).toBeFalse();
    expect(service.getIsMenuOpen()).toBeFalse();
  });

  it('toggles from the current signal state', () => {
    service.toggleMenu();
    expect(service.isOpenMenu()).toBeTrue();

    service.toggleMenu();
    expect(service.isOpenMenu()).toBeFalse();
  });
});
