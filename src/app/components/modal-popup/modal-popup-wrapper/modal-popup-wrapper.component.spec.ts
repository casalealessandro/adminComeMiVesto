import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { PopupWrapperComponent } from './modal-popup-wrapper.component';
import { PopUpService } from '../../../services/popup.service';

describe('PopupWrapperComponent characterization', () => {
  let popupState: BehaviorSubject<any[]>;
  let component: PopupWrapperComponent;

  beforeEach(() => {
    popupState = new BehaviorSubject<any[]>([]);
    TestBed.configureTestingModule({
      providers: [
        {
          provide: PopUpService,
          useValue: { popupsSet: popupState.asObservable() }
        }
      ]
    });

    component = TestBed.runInInjectionContext(() => new PopupWrapperComponent());
    component.ngOnInit();
  });

  it('adds a popup and converts the added action to the rendered state', () => {
    const popup = { id: 'popup-1', componentName: 'DynamicFormComponent', action: 'added' };

    popupState.next([popup]);

    expect(component.popups.length).toBe(1);
    expect(component.popups[0]).toBe(popup);
    expect(popup.action).toBe('setted');
    expect(popup.class).toBe(component.classSlideCenter);
  });

  it('keeps multiple added popups in the order received', () => {
    const first = { id: 'popup-1', componentName: 'DynamicFormComponent', action: 'added' };
    const second = { id: 'popup-2', componentName: 'ElementComponent', action: 'added' };

    popupState.next([first, second]);

    expect(component.popups.map(popup => popup.id)).toEqual(['popup-1', 'popup-2']);
  });

  it('replaces an updated popup after the historical animation delay', fakeAsync(() => {
    const popup = { id: 'popup-1', componentName: 'DynamicFormComponent', action: 'added' };
    popupState.next([popup]);

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
    const popup = { id: 'popup-1', componentName: 'DynamicFormComponent', action: 'added' };
    popupState.next([popup]);

    popup.action = 'remove';
    popupState.next([popup]);

    expect(popup.class).toBe('fade-out-bck');
    expect(component.popups.length).toBe(1);

    tick(300);
    expect(component.popups).toEqual([]);
  }));
});
