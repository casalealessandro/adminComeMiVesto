import { TestBed } from '@angular/core/testing';
import { convertToParamMap } from '@angular/router';
import { of, Subject } from 'rxjs';

import { OutfitCategoryComponent } from './outfit-category.component';
import { OutfitsService } from '../../services/outfit.service';
import { PopUpService } from '../../services/popup.service';
import { ActivatedRoute, Router } from '@angular/router';

describe('OutfitCategoryComponent popup characterization', () => {
  function setup() {
    TestBed.resetTestingModule();

    const output = new Subject<any>();
    const outfitService = jasmine.createSpyObj<OutfitsService>('OutfitsService', [
      'getOutFitCategories',
      'saveOutfitCategories',
      'updateOutfitCategories'
    ]);
    outfitService.getOutFitCategories.and.returnValue(of([]));
    outfitService.saveOutfitCategories.and.resolveTo(true);
    outfitService.updateOutfitCategories.and.resolveTo(true);

    const popup = jasmine.createSpyObj<PopUpService>(
      'PopUpService',
      ['setNewPopUp', 'destroyCurrentOpenPopUpByGuid'],
      { outputComponent: output }
    );
    const route = { paramMap: of(convertToParamMap({})) } as any;
    const router = jasmine.createSpyObj<Router>('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: OutfitsService, useValue: outfitService },
        { provide: PopUpService, useValue: popup },
        { provide: ActivatedRoute, useValue: route },
        { provide: Router, useValue: router }
      ]
    });

    const component = TestBed.runInInjectionContext(() => new OutfitCategoryComponent());
    return { component, outfitService, popup, output };
  }

  function lastGuid(popup: jasmine.SpyObj<PopUpService>): string {
    return popup.setNewPopUp.calls.mostRecent().args[0] as string;
  }

  async function flushPromise(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
  }

  it('opens DynamicFormComponent with a new guid for each category popup', () => {
    const { component, popup } = setup();

    component.createOrEditCategories({ service: 'outfitCategories', idData: { parentCategory: 'parent-1' } });
    const guidA = lastGuid(popup);
    component.createOrEditCategories({ service: 'outfitCategories', editData: { id: 'category-2' } });
    const guidB = lastGuid(popup);

    expect(guidA).toBeTruthy();
    expect(guidB).toBeTruthy();
    expect(guidB).not.toBe(guidA);
    expect(popup.setNewPopUp.calls.mostRecent().args[1]).toBe('DynamicFormComponent');
  });

  it('keeps simultaneous category popup events isolated by guid and releases only the terminal listener', () => {
    const { component, popup, output } = setup();

    component.createOrEditCategories({ service: 'outfitCategories', idData: {} });
    const guidA = lastGuid(popup);
    component.createOrEditCategories({ service: 'outfitCategories', idData: {} });
    const guidB = lastGuid(popup);

    expect(output.observers.length).toBe(2);

    output.next({ guid: guidB, name: 'cancelForm' });
    expect(popup.destroyCurrentOpenPopUpByGuid).toHaveBeenCalledWith(guidB);
    expect(popup.destroyCurrentOpenPopUpByGuid).not.toHaveBeenCalledWith(guidA);
    expect(output.observers.length).toBe(1);

    output.next({ guid: guidA, name: 'cancelForm' });
    expect(popup.destroyCurrentOpenPopUpByGuid).toHaveBeenCalledWith(guidA);
    expect(output.observers.length).toBe(0);
  });

  it('keeps the popup and listener alive when submit does not complete successfully', async () => {
    const { component, outfitService, popup, output } = setup();
    outfitService.saveOutfitCategories.and.resolveTo(false);

    component.createOrEditCategories({ service: 'outfitCategories', idData: {} });
    const guid = lastGuid(popup);

    output.next({
      guid,
      name: 'submitForm',
      inEdit: false,
      formData: { categoryName: 'Nuova categoria', parentCategory: null }
    });
    await flushPromise();

    expect(outfitService.saveOutfitCategories).toHaveBeenCalled();
    expect(popup.destroyCurrentOpenPopUpByGuid).not.toHaveBeenCalled();
    expect(output.observers.length).toBe(1);
  });

  it('closes the matching popup only after a successful submit and releases its listener', async () => {
    const { component, outfitService, popup, output } = setup();

    component.createOrEditCategories({ service: 'outfitCategories', idData: {} });
    const guid = lastGuid(popup);

    output.next({
      guid,
      name: 'submitForm',
      inEdit: false,
      formData: { categoryName: 'Nuova categoria', parentCategory: null }
    });
    await flushPromise();

    expect(outfitService.saveOutfitCategories).toHaveBeenCalled();
    expect(popup.destroyCurrentOpenPopUpByGuid).toHaveBeenCalledWith(guid);
    expect(output.observers.length).toBe(0);
  });

  it('cancelForm closes the matching popup and releases its listener', () => {
    const { component, popup, output } = setup();

    component.createOrEditCategories({ service: 'outfitCategories', idData: {} });
    const guid = lastGuid(popup);

    output.next({ guid, name: 'cancelForm' });

    expect(popup.destroyCurrentOpenPopUpByGuid).toHaveBeenCalledWith(guid);
    expect(output.observers.length).toBe(0);
  });
});
