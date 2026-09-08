import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, Subject } from 'rxjs';

import { OutfitProductsComponent } from './outfit-products.component';
import { OutfitsService } from '../../services/outfit.service';
import { PopUpService } from '../../services/popup.service';

describe('OutfitProductsComponent popup lifecycle D.2.3b', () => {
  function setup() {
    TestBed.resetTestingModule();

    const output = new Subject<any>();
    const outfitService = jasmine.createSpyObj<OutfitsService>('OutfitsService', [
      'getProducts',
      'updateProductOutfit'
    ]);
    outfitService.getProducts.and.returnValue(of([]));
    outfitService.updateProductOutfit.and.returnValue(true);

    const popup = jasmine.createSpyObj<PopUpService>(
      'PopUpService',
      ['setNewPopUp', 'destroyCurrentOpenPopUpByGuid'],
      { outputComponent: output }
    );

    TestBed.configureTestingModule({
      providers: [
        { provide: OutfitsService, useValue: outfitService },
        { provide: PopUpService, useValue: popup },
        { provide: ActivatedRoute, useValue: {} },
        { provide: Router, useValue: {} }
      ]
    });

    const component = TestBed.runInInjectionContext(() => new OutfitProductsComponent());
    spyOn(component, 'loadProduct');

    return { component, outfitService, popup, output };
  }

  function lastGuid(popup: jasmine.SpyObj<PopUpService>): string {
    return popup.setNewPopUp.calls.mostRecent().args[0] as string;
  }

  it('opens DynamicFormComponent with a new guid for each product editor popup', () => {
    const { component, popup } = setup();

    component.createOrEditCategories({ service: 'outfitProducts', editData: { id: 'product-1' } });
    const guidA = lastGuid(popup);
    component.createOrEditCategories({ service: 'outfitProducts', editData: { id: 'product-2' } });
    const guidB = lastGuid(popup);

    expect(guidA).toBeTruthy();
    expect(guidB).toBeTruthy();
    expect(guidB).not.toBe(guidA);
    expect(popup.setNewPopUp.calls.mostRecent().args[1]).toBe('DynamicFormComponent');
  });

  it('keeps simultaneous product editor events isolated and releases only the successful terminal listener', () => {
    const { component, popup, output } = setup();

    component.createOrEditCategories({ service: 'outfitProducts', editData: { id: 'product-1' } });
    const guidA = lastGuid(popup);
    component.createOrEditCategories({ service: 'outfitProducts', editData: { id: 'product-2' } });
    const guidB = lastGuid(popup);

    expect(output.observers.length).toBe(2);

    output.next({
      guid: guidB,
      name: 'submitForm',
      inEdit: true,
      formData: { id: 'product-2', name: 'Prodotto B' }
    });

    expect(popup.destroyCurrentOpenPopUpByGuid).toHaveBeenCalledWith(guidB);
    expect(popup.destroyCurrentOpenPopUpByGuid).not.toHaveBeenCalledWith(guidA);
    expect(output.observers.length).toBe(1);

    output.next({ guid: guidA, name: 'cancelForm' });
    expect(popup.destroyCurrentOpenPopUpByGuid).toHaveBeenCalledWith(guidA);
    expect(output.observers.length).toBe(0);
  });

  it('keeps the product editor popup and listener alive when update returns false', () => {
    const { component, outfitService, popup, output } = setup();
    outfitService.updateProductOutfit.and.returnValue(false);

    component.createOrEditCategories({ service: 'outfitProducts', editData: { id: 'product-1' } });
    const guid = lastGuid(popup);

    output.next({
      guid,
      name: 'submitForm',
      inEdit: true,
      formData: { id: 'product-1', name: 'Prodotto A' }
    });

    expect(outfitService.updateProductOutfit).toHaveBeenCalled();
    expect(popup.destroyCurrentOpenPopUpByGuid).not.toHaveBeenCalled();
    expect(output.observers.length).toBe(1);
  });

  it('cancelForm closes the matching product editor and releases its listener', () => {
    const { component, popup, output } = setup();

    component.createOrEditCategories({ service: 'outfitProducts', editData: { id: 'product-1' } });
    const guid = lastGuid(popup);

    output.next({ guid, name: 'cancelForm' });

    expect(popup.destroyCurrentOpenPopUpByGuid).toHaveBeenCalledWith(guid);
    expect(output.observers.length).toBe(0);
  });

  it('treats stochiudendo as terminal only for the matching feed popup', () => {
    const { component, popup, output } = setup();

    component.showFeedProductComponent();
    const guidA = lastGuid(popup);
    component.showFeedProductComponent();
    const guidB = lastGuid(popup);

    expect(popup.setNewPopUp.calls.mostRecent().args[1]).toBe('ProductFromFeedComponent');
    expect(output.observers.length).toBe(2);

    output.next({ guid: guidB, name: 'stochiudendo' });
    expect(component.loadProduct).toHaveBeenCalledTimes(1);
    expect(output.observers.length).toBe(1);

    output.next({ guid: guidA, name: 'stochiudendo' });
    expect(component.loadProduct).toHaveBeenCalledTimes(2);
    expect(output.observers.length).toBe(0);
  });
});
