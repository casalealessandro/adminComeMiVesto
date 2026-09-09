import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { PopupWrapperComponent } from './modal-popup-wrapper.component';
import { PopUpService } from '../../../services/popup.service';

describe('PopupWrapperComponent characterization', () => {
  let popupState: BehaviorSubject<any[]>;
  let component: PopupWrapperComponent;
  let popupService: any;

  beforeEach(() => {
    popupState = new BehaviorSubject<any[]>([]);
    popupService = {
      popupsSet: popupState.asObservable(),
      destroyCurrentOpenPopUpByGuid: jasmine.createSpy('destroyCurrentOpenPopUpByGuid'),
      destroyCurrentOpenPopUp: jasmine.createSpy('destroyCurrentOpenPopUp'),
      setOutputComponent: jasmine.createSpy('setOutputComponent'),
      destroyOutputComponent: jasmine.createSpy('destroyOutputComponent')
    };

    TestBed.configureTestingModule({
      providers: [
        {
          provide: PopUpService,
          useValue: popupService
        }
      ]
    });

    component = TestBed.runInInjectionContext(() => new PopupWrapperComponent());
    component.ngOnInit();
  });

  afterEach(() => {
    document.querySelectorAll('[data-popup-wrapper-spec]').forEach(element => element.remove());
  });

  it('adds a popup and converts the added action to the rendered state', fakeAsync(() => {
    const popup: any = { id: 'popup-1', componentName: 'DynamicFormComponent', action: 'added' };

    popupState.next([popup]);
    tick();

    expect(component.popups.length).toBe(1);
    expect(component.popups[0]).toBe(popup);
    expect(popup.action).toBe('setted');
    expect(popup.class).toBe(component.classSlideCenter);
  }));

  it('keeps multiple added popups in the order received', fakeAsync(() => {
    const first: any = { id: 'popup-1', componentName: 'DynamicFormComponent', action: 'added' };
    const second: any = { id: 'popup-2', componentName: 'ElementComponent', action: 'added' };

    popupState.next([first, second]);
    tick();

    expect(component.popups.map(popup => popup.id)).toEqual(['popup-1', 'popup-2']);
  }));

  it('replaces an updated popup after the historical animation delay', fakeAsync(() => {
    const popup: any = { id: 'popup-1', componentName: 'DynamicFormComponent', action: 'added' };
    popupState.next([popup]);
    tick();

    popup.action = 'update';
    popupState.next([popup]);

    expect(component.popups).toEqual([]);
    expect(popup.action).toBe('setted');

    tick(500);
    expect(component.popups.length).toBe(1);
    expect(component.popups[0]).toBe(popup);
    expect(popup.class).toBe(component.classSlideCenter);
  }));

  it('removes a popup after the historical fade-out delay', fakeAsync(() => {
    const popup: any = { id: 'popup-1', componentName: 'DynamicFormComponent', action: 'added' };
    popupState.next([popup]);
    tick();

    popup.action = 'remove';
    popupState.next([popup]);

    expect(popup.class).toBe('fade-out-bck');
    expect(component.popups.length).toBe(1);

    tick(300);
    expect(component.popups).toEqual([]);
  }));

  it('focuses a newly opened popup and restores the previous focus after close', fakeAsync(() => {
    const origin = document.createElement('button');
    origin.setAttribute('data-popup-wrapper-spec', 'origin');
    document.body.appendChild(origin);
    origin.focus();

    const popupElement = document.createElement('div');
    popupElement.id = 'popup-focus';
    popupElement.tabIndex = -1;
    popupElement.setAttribute('data-popup-wrapper-spec', 'popup');
    document.body.appendChild(popupElement);

    const popup: any = {
      id: 'popup-focus',
      componentName: 'DynamicFormComponent',
      action: 'added',
      isClosable: true
    };

    popupState.next([popup]);
    tick();
    expect(document.activeElement).toBe(popupElement);

    popup.action = 'remove';
    popupState.next([popup]);
    tick(300);

    expect(document.activeElement).toBe(origin);
  }));

  it('closes only the topmost closable popup when Escape is pressed', fakeAsync(() => {
    const first: any = {
      id: 'popup-a',
      componentName: 'DynamicFormComponent',
      action: 'added',
      isClosable: true
    };
    const second: any = {
      id: 'popup-b',
      componentName: 'ElementComponent',
      action: 'added',
      isClosable: true
    };

    popupState.next([first, second]);
    tick();

    component.onEscape(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));

    expect(popupService.destroyCurrentOpenPopUpByGuid).toHaveBeenCalledOnceWith('popup-b');
    expect(popupService.setOutputComponent).toHaveBeenCalledWith({ guid: 'popup-b', name: 'stochiudendo' });
    expect(popupService.destroyOutputComponent).toHaveBeenCalled();
  }));

  it('does not close the topmost popup with Escape when it is not closable', fakeAsync(() => {
    const popup: any = {
      id: 'popup-locked',
      componentName: 'DynamicFormComponent',
      action: 'added',
      isClosable: false
    };

    popupState.next([popup]);
    tick();

    component.onEscape(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));

    expect(popupService.destroyCurrentOpenPopUpByGuid).not.toHaveBeenCalled();
    expect(popupService.setOutputComponent).not.toHaveBeenCalled();
  }));
});
