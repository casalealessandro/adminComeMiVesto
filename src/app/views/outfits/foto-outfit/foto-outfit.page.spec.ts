import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { PopUpService } from '../../../services/popup.service';
import { FotoOutfitPage } from './foto-outfit.page';

describe('FotoOutfitPage popup lifecycle', () => {
  function setup() {
    TestBed.resetTestingModule();

    const output = new Subject<any>();
    const popup = jasmine.createSpyObj<PopUpService>(
      'PopUpService',
      ['setNewPopUp', 'destroyCurrentOpenPopUpByGuid'],
      { outputComponent: output }
    );

    TestBed.configureTestingModule({
      providers: [
        { provide: PopUpService, useValue: popup }
      ]
    });

    const component = TestBed.runInInjectionContext(() => new FotoOutfitPage());
    return { component, popup, output };
  }

  function lastGuid(popup: jasmine.SpyObj<PopUpService>): string {
    return popup.setNewPopUp.calls.mostRecent().args[0] as string;
  }

  async function flushPromise(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
  }

  it('keeps the tag popup listener alive after functionalInputClick and does not resolve the tag promise', async () => {
    const { component, popup, output } = setup();
    spyOn(component, 'openOutfitProducts').and.resolveTo();

    let settled = false;
    const modalPromise = component.openModal();
    modalPromise.then(() => settled = true);
    const guid = lastGuid(popup);

    expect(output.observers.length).toBe(1);

    output.next({ guid, name: 'functionalInputClick', nomeCampo: 'product' });
    await flushPromise();

    expect(component.openOutfitProducts).toHaveBeenCalledTimes(1);
    expect(settled).toBeFalse();
    expect(popup.destroyCurrentOpenPopUpByGuid).not.toHaveBeenCalled();
    expect(output.observers.length).toBe(1);
  });

  it('resolves submitForm for the matching tag popup and releases its listener', async () => {
    const { component, popup, output } = setup();

    const modalPromise = component.openModal();
    const guid = lastGuid(popup);
    const formData = { name: 'Giacca', prezzo: 99 };

    output.next({ guid, name: 'submitForm', formData });

    await expectAsync(modalPromise).toBeResolvedTo(formData);
    expect(popup.destroyCurrentOpenPopUpByGuid).toHaveBeenCalledWith(guid);
    expect(output.observers.length).toBe(0);
  });

  it('resolves cancelForm only for the matching tag popup and releases its listener', async () => {
    const { component, popup, output } = setup();

    const modalPromise = component.openModal();
    const guid = lastGuid(popup);

    output.next({ guid: 'other-guid', name: 'cancelForm' });
    await flushPromise();
    expect(popup.destroyCurrentOpenPopUpByGuid).not.toHaveBeenCalled();
    expect(output.observers.length).toBe(1);

    output.next({ guid, name: 'cancelForm' });

    await expectAsync(modalPromise).toBeResolvedTo(false);
    expect(popup.destroyCurrentOpenPopUpByGuid).toHaveBeenCalledWith(guid);
    expect(output.observers.length).toBe(0);
  });

  it('keeps simultaneous tag popup promises isolated and releases only each terminal listener', async () => {
    const { component, popup, output } = setup();

    let settledA = false;
    const promiseA = component.openModal();
    promiseA.then(() => settledA = true);
    const guidA = lastGuid(popup);

    const promiseB = component.openModal();
    const guidB = lastGuid(popup);

    expect(guidB).not.toBe(guidA);
    expect(output.observers.length).toBe(2);

    output.next({ guid: guidB, name: 'submitForm', formData: { name: 'B' } });
    await expectAsync(promiseB).toBeResolvedTo({ name: 'B' });
    expect(settledA).toBeFalse();
    expect(output.observers.length).toBe(1);

    output.next({ guid: guidA, name: 'cancelForm' });
    await expectAsync(promiseA).toBeResolvedTo(false);
    expect(output.observers.length).toBe(0);
  });

  it('keeps nested product popup listener alive on selectProduct and releases it on stochiudendo', () => {
    const { component, popup, output } = setup();

    component.openOutfitProducts();
    const guid = lastGuid(popup);

    expect(output.observers.length).toBe(1);

    output.next({ guid, name: 'selectProduct', data: { id: 'product-1' } });
    expect(output.observers.length).toBe(1);

    output.next({ guid, name: 'stochiudendo' });
    expect(output.observers.length).toBe(0);
  });

  it('keeps simultaneous nested product popups isolated by guid', () => {
    const { component, popup, output } = setup();

    component.openOutfitProducts();
    const guidA = lastGuid(popup);
    component.openOutfitProducts();
    const guidB = lastGuid(popup);

    expect(guidB).not.toBe(guidA);
    expect(output.observers.length).toBe(2);

    output.next({ guid: guidB, name: 'stochiudendo' });
    expect(output.observers.length).toBe(1);

    output.next({ guid: guidA, name: 'selectProduct', data: { id: 'product-a' } });
    expect(output.observers.length).toBe(1);

    output.next({ guid: guidA, name: 'stochiudendo' });
    expect(output.observers.length).toBe(0);
  });
});
