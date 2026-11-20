import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
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
          getCurationCategories: () => of([
            { id: 'scarpe', categoryName: 'Calzature' },
            { id: 'cappotti', categoryName: 'Capispalla' },
            { id: 'ABC_Completi', categoryName: 'Abiti e completi' },
            { id: 'P_Pantaloni', categoryName: 'Pantaloni' },
            { id: 'conna', categoryName: 'Gonne' },
            { id: 'M_Maglieria', categoryName: 'Maglieria' },
            { id: 'camicie', categoryName: 'Camicie' },
            { id: 'A_Accessori', categoryName: 'Accessori' },
            { id: 'tute', categoryName: 'Tute' },
          ]),
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

  it('uses taxonomy categoryName in the add-product category select while preserving ids', () => {
    component.addRole = 'BOTTOM';
    expect(component.availableCategories).toEqual(['conna', 'P_Pantaloni']);
    expect(component.categoryDisplayName('P_Pantaloni')).toBe('Pantaloni');
    expect(component.categoryDisplayName('conna')).toBe('Gonne');
    component.addCategory = 'P_Pantaloni';
    expect(component.addCategory).toBe('P_Pantaloni');
  });

  it('opens the registered Core popup with current category, gender and used ids', async () => {
    component.showReplacements(0);
    expect(popup.setNewPopUp).toHaveBeenCalledWith(
      jasmine.any(String), 'OutfitReplacementPickerComponent',
      { category: 'P_Pantaloni', gender: 'D', productIdsInOutfit: ['p1', 'p2'],
        role: 'BOTTOM', allowedCategories: ['P_Pantaloni', 'conna'],
        categoryLabels: jasmine.objectContaining({ P_Pantaloni: 'Pantaloni', conna: 'Gonne' }) },
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

  it('allows skirt to jeans without changing the BOTTOM slot or requesting another API', async () => {
    component.outfit.products[0].category = 'conna';
    component.outfit.products[0].name = 'Gonna midi';
    component.showReplacements(0);
    expect(popup.setNewPopUp).toHaveBeenCalledWith(
      jasmine.any(String), 'OutfitReplacementPickerComponent',
      { category: 'conna', gender: 'D', productIdsInOutfit: ['p1', 'p2'],
        role: 'BOTTOM', allowedCategories: ['P_Pantaloni', 'conna'],
        categoryLabels: jasmine.objectContaining({ P_Pantaloni: 'Pantaloni', conna: 'Gonne' }) },
      1180, undefined, undefined, false, true, 'Sostituisci prodotto', 'center', true,
    );
    const jeans = { id: 'jeans-2', category: 'P_Pantaloni', subcategory: 'jeans',
      brand: 'Brand', name: 'Jeans blu', genderTargets: ['D'] } as CatalogProduct;
    resolvePicker({ name: 'selected', product: jeans });
    await Promise.resolve();
    expect(component.form?.products[0]).toEqual(jasmine.objectContaining({
      catalogProductId: 'jeans-2', role: 'BOTTOM',
    }));
    expect(component.selectedReplacements.get(0)?.category).toBe('P_Pantaloni');
    expect(component.replacementLabel(0)).toContain('Jeans blu');
  });

  it('keeps replacements available if the editor category lookup returns 503', () => {
    const catalog = TestBed.inject(AffiliateCatalogService);
    spyOn(catalog, 'getCurationCategories').and.returnValue(throwError(() => ({ status: 503 })));
    component.startEditing();
    expect(component.error).toBe('');
    expect(component.categoryWarning).toContain('nomi di riserva');
    expect(component.productCategories).toContain('P_Pantaloni');
    expect(component.productCategories).toContain('conna');
    component.showReplacements(0);
    expect(popup.setNewPopUp).toHaveBeenCalled();
  });

  it('rejects incompatible replacement categories before saving the draft', () => {
    component.replacementIndex = 0;
    component.chooseReplacement({ id: 'shoes-3', category: 'scarpe', subcategory: 'stivali' } as CatalogProduct);
    expect(component.form?.products[0].catalogProductId).toBe('p1');
    expect(component.error).toContain('non è compatibile');
    expect(component.replacementIndex).toBeNull();
  });

  it('adds a new jacket slot after existing products, without generating an image', async () => {
    component.addRole = 'OUTERWEAR';
    component.addCategory = 'cappotti';
    expect(component.availableCategories).toContain('cappotti');
    expect(component.availableCategories).not.toContain('scarpe');
    component.addProduct();
    expect(popup.setNewPopUp).toHaveBeenCalledWith(
      jasmine.any(String), 'OutfitReplacementPickerComponent',
      { category: 'cappotti', gender: 'D', productIdsInOutfit: ['p1', 'p2'],
        categoryLabels: jasmine.objectContaining({ cappotti: 'Capispalla' }) },
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

  });

  it('allows a classified belt in the accessory slot, not as a bag', async () => {
    expect(component.availableRoles).toContain('ACCESSORY');
    component.addRole = 'ACCESSORY';
    expect(component.availableCategories).toEqual(['A_Accessori']);
    component.addCategory = 'A_Accessori';
    component.addProduct();
    const belt = {
      id: 'belt-1', category: 'A_Accessori', subcategory: 'cinture',
      genderTargets: ['D'], name: 'Cintura beige', brand: 'Marca', images: ['https://example.test/belt.jpg'],
    } as CatalogProduct;
    resolvePicker({name:'selected',product:belt});
    await Promise.resolve();
    expect(component.form?.products.at(-1)).toEqual({catalogProductId:'belt-1',role:'ACCESSORY'});
  });

  it('keeps the draft intact when the popup is closed without choosing a product', async () => {
    component.showReplacements(0);
    resolvePicker({ name: 'cancelled' });
    await Promise.resolve();
    expect(component.form?.products[0].catalogProductId).toBe('p1');
    expect(component.replacementIndex).toBeNull();
  });
});
