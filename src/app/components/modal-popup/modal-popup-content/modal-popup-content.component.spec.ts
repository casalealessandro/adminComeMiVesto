import { EventEmitter } from '@angular/core';
import { NicaPopupContentComponent, infoPopUp } from './modal-popup-content.component';
import { PopUpService } from '../../../services/popup.service';

describe('NicaPopupContentComponent characterization', () => {
  function setup() {
    const popupService = jasmine.createSpyObj<PopUpService>(
      'PopUpService',
      [
        'getComponentByName',
        'setOutputComponent',
        'destroyCurrentOpenPopUp',
        'destroyCurrentOpenPopUpByGuid',
        'destroyOutputComponent'
      ]
    );
    popupService.getComponentByName.and.returnValue(class RuntimeProbe {} as any);

    const runtimeInstance: any = {
      itemData: null,
      cssClass: '',
      injectedValue: null,
      saved: new EventEmitter<any>(),
      closed: new EventEmitter<boolean>()
    };

    const component = new NicaPopupContentComponent(popupService);
    component.containerComponent = {
      createComponent: jasmine.createSpy('createComponent').and.returnValue({ instance: runtimeInstance })
    } as any;

    const info: infoPopUp = {
      popUpWidth: '800',
      showCaptionHeader: true,
      showCaptionFooter: false,
      title: 'Runtime popup',
      isClosable: false,
      class: '',
      componentName: 'RuntimeProbe',
      accessoringData: { source: 'characterization' },
      position: 'center',
      dataToSend: { id: 42 },
      id: 'popup-42',
      instancedData: { injectedValue: 'injected' }
    };
    component.infoPopUp = info;

    return { component, popupService, runtimeInstance };
  }

  it('creates the registered runtime component and transfers historical data contracts', async () => {
    const { component, popupService, runtimeInstance } = setup();

    await component.ngOnInit();

    expect(popupService.getComponentByName).toHaveBeenCalledWith('RuntimeProbe');
    expect(runtimeInstance.itemData).toEqual({ id: 42 });
    expect(runtimeInstance.cssClass).toBe('modal-content ');
    expect(runtimeInstance.injectedValue).toBe('injected');
    expect(component.idPopUp).toBe('popup-42');
    expect(component.titlePopUp).toBe('Runtime popup');
    expect(component.position).toBe('center');
    expect(component.popUpWidth).toBe('800px');
  });

  it('bridges object EventEmitter values to PopUpService with popup metadata', async () => {
    const { component, popupService, runtimeInstance } = setup();
    await component.ngOnInit();

    runtimeInstance.saved.emit({ value: 7 });

    expect(popupService.setOutputComponent).toHaveBeenCalledWith(jasmine.objectContaining({
      value: 7,
      componentName: 'RuntimeProbe',
      accessoringData: { source: 'characterization' },
      guid: 'popup-42',
      name: 'saved'
    }));
  });

  it('wraps boolean EventEmitter values in the historical metadata envelope', async () => {
    const { component, popupService, runtimeInstance } = setup();
    await component.ngOnInit();

    runtimeInstance.closed.emit(true);

    expect(popupService.setOutputComponent).toHaveBeenCalledWith({
      componentName: 'RuntimeProbe',
      accessoringData: { source: 'characterization' },
      guid: 'popup-42',
      name: 'closed'
    });
  });

  it('closes by guid and publishes the historical closing event', () => {
    const { component, popupService } = setup();
    component.idPopUp = 'popup-42';
    component.componentName = 'RuntimeProbe';

    component.emettiChiusura(null);

    expect(popupService.destroyCurrentOpenPopUpByGuid).toHaveBeenCalledWith('popup-42');
    expect(popupService.setOutputComponent).toHaveBeenCalledWith({ guid: 'popup-42', name: 'stochiudendo' });
    expect(popupService.destroyOutputComponent).toHaveBeenCalled();
  });
});
