import { fakeAsync, tick } from '@angular/core/testing';
import { comeMiVestoPopupComponents } from '../app-popup-components';
import { starterKitEntryComponents } from './entryComponents';
import { PopUpService } from './popup.service';

describe('PopUpService characterization', () => {
  let service: PopUpService;

  beforeEach(() => {
    service = new PopUpService([
      ...starterKitEntryComponents,
      ...comeMiVestoPopupComponents,
    ]);
  });

  it('registers a new popup with the current public configuration contract', () => {
    service.setNewPopUp(
      'popup-1',
      'DynamicFormComponent',
      { id: 1 },
      640,
      { source: 'users' },
      { editData: { id: 1 } },
      true,
      true,
      'Modifica',
      'center',
      true
    );

    expect(service.currentPopupsSet.length).toBe(1);
    expect(service.currentPopupsSet[0]).toEqual(jasmine.objectContaining({
      id: 'popup-1',
      componentName: 'DynamicFormComponent',
      dataToSend: { id: 1 },
      popUpWidth: 640,
      accessoringData: { source: 'users' },
      instancedData: { editData: { id: 1 } },
      showCaptionFooter: true,
      showCaptionHeader: true,
      title: 'Modifica',
      position: 'center',
      isClosable: true,
      isClosablePopUp: true,
      action: 'added'
    }));
  });

  it('updates the existing popup when id and component name match', () => {
    service.setNewPopUp('popup-1', 'DynamicFormComponent', { value: 1 }, 800, null, null, false, true, '', 'center', false);
    service.setNewPopUp('popup-1', 'DynamicFormComponent', { value: 2 }, 800, null, null, true, false, '', 'center', true);

    expect(service.currentPopupsSet.length).toBe(1);
    expect(service.currentPopupsSet[0].dataToSend).toEqual({ value: 2 });
    expect(service.currentPopupsSet[0].showCaptionFooter).toBeTrue();
    expect(service.currentPopupsSet[0].showCaptionHeader).toBeFalse();
    expect(service.currentPopupsSet[0].isClosable).toBeTrue();
    expect(service.currentPopupsSet[0].isClosablePopUp).toBeTrue();
    expect(service.currentPopupsSet[0].action).toBe('update');
  });

  it('keeps different popup identities independent', () => {
    service.setNewPopUp('popup-1', 'DynamicFormComponent', { value: 1 });
    service.setNewPopUp('popup-2', 'ElementComponent', { value: 2 });

    expect(service.currentPopupsSet.map(popup => popup.id)).toEqual(['popup-1', 'popup-2']);
  });

  it('resolves all current starter-kit and ComeMiVesto registrations by the historical names', () => {
    const names = [
      'DynamicFormComponent',
      'ElementComponent',
      'ProductFromFeedComponent',
      'OutfitProductsComponent',
    ];

    names.forEach(name => {
      expect(service.isComponentExistByName(name)).toBeTrue();
      expect(service.getComponentByName(name)).toBeTruthy();
    });
  });

  it('can resolve a component supplied externally without changing PopUpService', () => {
    class ExternalPopupComponent {}

    const externalService = new PopUpService([
      { name: 'ExternalPopupComponent', component: ExternalPopupComponent },
    ]);

    expect(externalService.isComponentExistByName('ExternalPopupComponent')).toBeTrue();
    expect(externalService.getComponentByName('ExternalPopupComponent')).toBe(ExternalPopupComponent);
  });

  it('handles unknown registry names deterministically', () => {
    expect(service.isComponentExistByName('MissingComponent')).toBeFalse();
    expect(() => service.getComponentByName('MissingComponent')).toThrowError(
      'Component "MissingComponent" is not registered'
    );
  });

  it('uses a numeric viewport width on mobile so PopupContent can append px safely', () => {
    spyOnProperty(window, 'innerWidth', 'get').and.returnValue(500);

    service.setNewPopUp('popup-mobile', 'DynamicFormComponent', null, 800);

    expect(service.currentPopupsSet[0].popUpWidth).toBe(500);
  });

  it('forwards output events through the shared output stream', () => {
    let received: any;
    const subscription = service.outputComponent.subscribe(value => received = value);

    const event = { guid: 'popup-1', name: 'save', value: 42 };
    service.setOutputComponent(event);

    expect(received).toBe(event);
    subscription.unsubscribe();
  });

  it('getOutputComponent ignores events for other guids and resolves the matching event', async () => {
    let resolved = false;
    const expected = { guid: 'popup-1', name: 'save', value: 42 };
    const resultPromise = service.getOutputComponent('popup-1').then(result => {
      resolved = true;
      return result;
    });

    service.setOutputComponent({ guid: 'popup-2', name: 'save', value: 7 });
    await Promise.resolve();
    expect(resolved).toBeFalse();

    service.setOutputComponent(expected);

    await expectAsync(resultPromise).toBeResolvedTo(expected);
  });

  it('getOutputComponent keeps simultaneous popup waits independent by guid', async () => {
    const popupA = service.getOutputComponent('popup-a');
    const popupB = service.getOutputComponent('popup-b');

    const eventB = { guid: 'popup-b', name: 'save', value: 'B' };
    const eventA = { guid: 'popup-a', name: 'save', value: 'A' };

    service.setOutputComponent(eventB);
    await expectAsync(popupB).toBeResolvedTo(eventB);

    service.setOutputComponent(eventA);
    await expectAsync(popupA).toBeResolvedTo(eventA);
  });

  it('getOutputComponent adds one listener for one waiting guid', () => {
    const outputSubject = (service as any)._outputComponent;
    const listenersBefore = outputSubject.observers.length;

    service.getOutputComponent('popup-1');

    expect(outputSubject.observers.length).toBe(listenersBefore + 1);
  });

  it('getOutputComponent releases its listener after the matching event resolves', async () => {
    const outputSubject = (service as any)._outputComponent;
    const listenersBefore = outputSubject.observers.length;
    const resultPromise = service.getOutputComponent('popup-1');

    expect(outputSubject.observers.length).toBe(listenersBefore + 1);

    service.setOutputComponent({ guid: 'popup-1', name: 'save' });
    await resultPromise;

    expect(outputSubject.observers.length).toBe(listenersBefore);
  });

  it('removes a popup immediately by guid and reports whether it was found', () => {
    service.setNewPopUp('popup-1', 'DynamicFormComponent', null);

    expect(service.destroyCurrentOpenPopUpByGuid('popup-1')).toBeTrue();
    expect(service.currentPopupsSet).toEqual([]);
    expect(service.destroyCurrentOpenPopUpByGuid('missing')).toBeFalse();
  });

  it('keeps the historical delayed close when removing by component name', fakeAsync(() => {
    service.setNewPopUp('popup-1', 'DynamicFormComponent', null);

    service.destroyCurrentOpenPopUp('DynamicFormComponent');
    expect(service.currentPopupsSet[0].action).toBe('remove');

    tick(500);
    expect(service.currentPopupsSet).toEqual([]);
  }));

  it('clears every open popup without changing the external API', () => {
    service.setNewPopUp('popup-1', 'DynamicFormComponent', null);
    service.setNewPopUp('popup-2', 'ElementComponent', null);

    service.destroyCurrentOpenPopUps();

    expect(service.currentPopupsSet).toEqual([]);
  });
});
