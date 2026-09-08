import { fakeAsync, tick } from '@angular/core/testing';
import { PopUpService } from './popup.service';

describe('PopUpService characterization', () => {
  let service: PopUpService;

  beforeEach(() => {
    service = new PopUpService();
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
      isClosablePopUp: true,
      action: 'added'
    }));
  });

  it('updates the existing popup when id and component name match', () => {
    service.setNewPopUp('popup-1', 'DynamicFormComponent', { value: 1 }, 800, null, null, false, true);
    service.setNewPopUp('popup-1', 'DynamicFormComponent', { value: 2 }, 800, null, null, true, false);

    expect(service.currentPopupsSet.length).toBe(1);
    expect(service.currentPopupsSet[0].dataToSend).toEqual({ value: 2 });
    expect(service.currentPopupsSet[0].showCaptionFooter).toBeTrue();
    expect(service.currentPopupsSet[0].showCaptionHeader).toBeFalse();
    expect(service.currentPopupsSet[0].action).toBe('update');
  });

  it('keeps different popup identities independent', () => {
    service.setNewPopUp('popup-1', 'DynamicFormComponent', { value: 1 });
    service.setNewPopUp('popup-2', 'ElementComponent', { value: 2 });

    expect(service.currentPopupsSet.map(popup => popup.id)).toEqual(['popup-1', 'popup-2']);
  });

  it('resolves components already registered by name', () => {
    expect(service.isComponentExistByName('DynamicFormComponent')).toBeTrue();
    expect(service.getComponentByName('DynamicFormComponent')).toBeTruthy();
    expect(service.isComponentExistByName('ElementComponent')).toBeTrue();
  });

  it('forwards output events through the shared output stream', () => {
    let received: any;
    const subscription = service.outputComponent.subscribe(value => received = value);

    const event = { guid: 'popup-1', name: 'save', value: 42 };
    service.setOutputComponent(event);

    expect(received).toBe(event);
    subscription.unsubscribe();
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
