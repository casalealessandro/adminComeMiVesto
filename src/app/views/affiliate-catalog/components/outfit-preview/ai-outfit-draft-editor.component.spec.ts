import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AffiliateCatalogService } from '../../services/affiliate-catalog.service';
import { PopUpService } from '../../../../core/popup/popup.service';
import { AiOutfitPreviewOutfit } from '../../models/affiliate-catalog-api.models';
import { CatalogProduct } from '../../models/affiliate-catalog.models';
import { AiOutfitDraftEditorComponent } from './ai-outfit-draft-editor.component';
import { OutfitReplacementPickerResult } from './outfit-replacement-picker.component';

describe('AI outfit draft replacement via Core popup', () => {
  let component: AiOutfitDraftEditorComponent;
  let popup: jasmine.SpyObj<PopUpService>;
  let resolvePicker!: (response: OutfitReplacementPickerResult) => void;

  beforeEach(() => {
    popup = jasmine.createSpyObj('PopUpService', ['setNewPopUp', 'getOutputComponent', 'destroyCurrentOpenPopUpByGuid']);
    popup.getOutputComponent.and.returnValue(new Promise(resolve => { resolvePicker = resolve; }));
    TestBed.configureTestingModule({
      providers: [
        { provide: AffiliateCatalogService, useValue: {
          getProductCategories: () => of(['scarpe', 'cappotti', 'ABC_Completi', 'P_Pantaloni', 'M_Maglieria', 'camicie']),
        } },
        { provide: PopUpService, useValue: popup },
      ],
    });
    component = TestBed.runInInjectionContext(() => new AiOutfitDraftEditorComponent());
    component.outfit = {
      draftId: 'draft-1', title: 'Look', description: 'Descrizione',
      gender: 'D', season: 'A', style: 'C',
      products: [
        { catalogProductId: 'p1', category: 'P_Pantaloni', name: 'Jeans', role: 'BOTTOM' },
        { catalogProductId: 'p2', category: 'scarpe', name: 'Stivali', role: 'SHOES' },
      ],
    } as unknown as AiOutfitPreviewOutfit;
    component.startEditing();
  });

  it('opens the registered Core popup with current category, gender and used ids', async () => {
    component.showReplacements(0);
    expect(popup.setNewPopUp).toHaveBeenCalledWith(
      jasmine.any(String), 'OutfitReplacementPickerComponent',
      { category: 'P_Pantaloni', gender: 'D', productIdsInOutfit: ['p1', 'p2'] },
      1180, undefined, undefined, false, true, 'Sostituisci prodotto', 'center', true,
    );
    expect(component.form?.products[0].catalogProductId).toBe('p1');
    const next = { id: 'p3', category: 'P_Pantaloni', brand: 'New', name: 'Jeans alternativi' } as CatalogProduct;
    resolvePicker({ name: 'selected', product: next });
    await Promise.resolve();
    expect(component.form?.products[0].catalogProductId).toBe('p3');
    expect(component.replacementLabel(0)).toContain('Jeans alternativi');
    expect(component.replacementIndex).toBeNull();
    expect(popup.destroyCurrentOpenPopUpByGuid).toHaveBeenCalled();
  });

  it('adds a new jacket slot after existing products, without generating an image', async () => {
    component.addRole = 'OUTERWEAR';
    component.addCategory = 'cappotti';
    expect(component.availableCategories).toContain('cappotti');
    expect(component.availableCategories).not.toContain('scarpe');
    component.addProduct();
    expect(popup.setNewPopUp).toHaveBeenCalledWith(
      jasmine.any(String), 'OutfitReplacementPickerComponent',
      { category: 'cappotti', gender: 'D', productIdsInOutfit: ['p1', 'p2'] },
      1180, undefined, undefined, false, true, 'Aggiungi prodotto', 'center', true,
    );
    const jacket = {
      id:'jacket3', category:'cappotti', subcategory:'piumino',
      brand:'Marca', name:'Giacca', genderTargets:['D'], images:['https://example.test/jacket.jpg'],
    } as CatalogProduct;
    resolvePicker({name:'selected', product:jacket});
    await Promise.resolve();
    expect(component.form?.products.map(p => p.catalogProductId)).toEqual(['p1','p2','jacket3']);
    expect(component.form?.products[2].role).toBe('OUTERWEAR');
    expect(component.addingProduct).toBeFalse();
  });

  it('keeps the draft intact when the popup is closed without choosing a product', async () => {
    component.showReplacements(0);
    resolvePicker({ name: 'cancelled' });
    await Promise.resolve();
    expect(component.form?.products[0].catalogProductId).toBe('p1');
    expect(component.replacementIndex).toBeNull();
  });
});
