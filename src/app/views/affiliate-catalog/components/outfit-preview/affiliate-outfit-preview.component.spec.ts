import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AiOutfitDraftEditorComponent } from './ai-outfit-draft-editor.component';
import { of, Subject, throwError } from 'rxjs';
import { AffiliateCatalogService } from '../../services/affiliate-catalog.service';
import { PopUpService } from '../../../../core/popup/popup.service';
import { AiOutfitPreviewResult } from '../../models/affiliate-catalog-api.models';
import { AffiliateOutfitPreviewComponent, describeAiOutfitPreviewError } from './affiliate-outfit-preview.component';

const previewResult: AiOutfitPreviewResult = {
  generatedAt: 1000,
  model: 'gpt-5.6-terra',
  providerResponseId: 'resp-stylist',
  request: { gender: 'MAN', season: 'SPRING', occasion: 'EVERYDAY', style: 'CASUAL' },
  candidatesEvaluated: 36,
  imagesEvaluated: 36,
  usage: {
    inputTokens: 1300,
    cachedInputTokens: 100,
    outputTokens: 900,
    totalTokens: 2200,
    stylist: { inputTokens: 1000, cachedInputTokens: 100, outputTokens: 100, totalTokens: 1100 },
    imageGeneration: {
      inputTokens: 300,
      cachedInputTokens: 0,
      outputTokens: 800,
      totalTokens: 1100,
      model: 'gpt-image-2.5-sunburst',
      imagesGenerated: 3,
      providerResponseIds: ['img-1', 'img-2', 'img-3'],
    },
  },
  outfits: [1, 2, 3].map((index) => ({
    draftId: `draft-${index}`,
    title: `Look ${index}`,
    description: `Descrizione ${index}`,
    gender: 'U' as const,
    season: 'P' as const,
    style: 'C' as const,
    previewImageUrl: `https://storage.test/look-${index}.png`,
    products: [1, 2, 3].map((productIndex) => ({
      catalogProductId: `p-${index}-${productIndex}`,
      affiliateProgramId: index % 2 ? 'program-a' : 'program-b',
      role: ['TOP', 'BOTTOM', 'SHOES'][productIndex - 1],
      x: [0.38, 0.62, 0.42][productIndex - 1],
      y: [0.34, 0.61, 0.86][productIndex - 1],
      name: `Prodotto ${productIndex}`,
      brand: 'Brand',
      category: 'Categoria',
      subcategory: 'Sottocategoria',
      normalizedColor: 'N',
      images: [`https://merchant.test/product-${productIndex}.jpg`],
      price: 100,
      currency: 'EUR',
      affiliateUrl: `https://merchant.test/click-${productIndex}`,
      productUrl: `https://merchant.test/product-${productIndex}`,
      availability: 'in stock',
    })),
  })),
};

describe('AffiliateOutfitPreviewComponent', () => {
  let fixture: ComponentFixture<AffiliateOutfitPreviewComponent>;
  let component: AffiliateOutfitPreviewComponent;
  let service: jasmine.SpyObj<AffiliateCatalogService>;

  beforeEach(async () => {
    service = jasmine.createSpyObj<AffiliateCatalogService>(
      'AffiliateCatalogService',
      ['generateOutfitPreview', 'getPendingOutfitDrafts', 'publishOutfitPreview', 'discardOutfitDraft', 'getPrograms', 'getFeeds', 'getAiCreators', 'getOutfitStyles', 'getOutfitOccasions', 'updateOutfitDraft', 'regenerateOutfitDraftImage', 'getProducts', 'getProductCategories'],
    );
    service.getPrograms.and.returnValue(of([{
      id: 'program-a',
      network: 'TRADEDOUBLER',
      networkProgramId: 'merchant-a',
      name: 'Merchant A',
      networkStatus: 'ACTIVE',
      enabled: true,
      defaultAdapterType: 'TRADEDOUBLER',
      market: 'IT',
      currency: 'EUR',
      priceSegment: 'MID_RANGE',
      createdAt: 1,
      updatedAt: 1,
    }]));
    service.getFeeds.and.returnValue(of([]));
    service.getOutfitOccasions.and.returnValue(of([{ id: 'EVERYDAY', value: 'Quotidiano', order: 1, active: true }]));
    service.getOutfitStyles.and.returnValue(of([{ id: 'C', value: 'Casual', order: 10 }, { id: 'BOHO', value: 'Boho', order: 20 }]));
    service.discardOutfitDraft.and.returnValue(of(void 0));
    service.getAiCreators.and.returnValue(of([{
      uid: 'creator-d',
      email: 'creator@example.com',
      displayName: 'Creator Donna',
      nome: 'Creator',
      cognome: 'Donna',
      bio: 'Virtual fashion creator',
      photoURL: 'https://example.test/avatar.jpg',
      gender: 'D',
      styleAffinity: ['C', 'SC'],
      personaPrompt: 'Look casual contemporanei.',
      active: true,
      createdAt: 1,
      updatedAt: 1,
    }]));
    service.getPendingOutfitDrafts.and.returnValue(of([]));
    service.generateOutfitPreview.and.returnValue(of(structuredClone(previewResult)));
    service.publishOutfitPreview.and.returnValue(of({
      id: 'outfit-1',
      title: 'Look 1',
      imageUrl: 'https://storage.test/outfits/ai/outfit-1.png',
      status: 'approved',
      userId: 'comemivesto-ai-outfit',
      createdAt: 2000,
    }));

    await TestBed.configureTestingModule({
      imports: [AffiliateOutfitPreviewComponent],
      providers: [
        { provide: AffiliateCatalogService, useValue: service },
        { provide: PopUpService, useValue: jasmine.createSpyObj('PopUpService', ['setNewPopUp', 'getOutputComponent', 'destroyCurrentOpenPopUpByGuid']) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AffiliateOutfitPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('starts from the real baseline request and resolves program labels', () => {
    expect(component.request).toEqual({
      gender: 'MAN', season: 'SPRING', occasion: 'EVERYDAY', style: 'AUTO',
    });
    expect(component.styleOptions).toContain(jasmine.objectContaining({value: 'BOHO', label: 'Boho'}));
    expect(component.programLabel('program-a')).toBe('Merchant A');
    expect(component.programLabel('program-b')).toBe('program-b');
  });

  it('defaults to non-selected automatic style while allowing explicit taxonomy styles', () => {
    fixture.detectChanges();
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select[name="style"]');
    expect(select.textContent).toContain('Non selezionato');
    expect(component.request.style).toBe('AUTO');
    component.generate();
    expect(service.generateOutfitPreview).toHaveBeenCalledWith(jasmine.objectContaining({ style: 'AUTO' }));
    service.generateOutfitPreview.calls.reset();
    component.request.style = 'BOHO';
    component.generate();
    expect(service.generateOutfitPreview).toHaveBeenCalledWith(jasmine.objectContaining({ style: 'BOHO' }));
  });

  it('generates a batch and renders hero images next to real product references and usage', () => {
    component.generate();
    fixture.detectChanges();

    expect(service.generateOutfitPreview).toHaveBeenCalledWith(component.request);
    expect(component.result?.outfits.length).toBe(3);
    expect(component.loading).toBeFalse();

    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelectorAll('.outfit-card').length).toBe(3);
    expect(host.querySelectorAll('.outfit-card__hero img').length).toBe(3);
    expect(host.querySelectorAll('.outfit-card__tag-pin').length).toBe(9);
    expect(host.querySelectorAll('.product-reference').length).toBe(9);
    expect(host.querySelectorAll('.outfit-card__approve').length).toBe(3);
    expect(host.textContent).toContain('gpt-image-2.5-sunburst');
    expect(host.textContent).toContain('Merchant A');
  });

  it('shows the optional outerwear warning on generated looks and pending drafts without blocking review', () => {
    const preview = structuredClone(previewResult);
    preview.outfits[0].editorialWarnings = ['MISSING_OPTIONAL_OUTERWEAR'];
    service.generateOutfitPreview.and.returnValue(of(preview));
    component.generate();
    fixture.detectChanges();

    const host: HTMLElement = fixture.nativeElement;
    const warning = host.querySelector('.outfit-card .alert-warning[role="status"]');
    expect(warning?.textContent).toContain('Capospalla non disponibile');
    expect(host.querySelectorAll('.outfit-card .alert-warning[role="status"]').length).toBe(1);
    expect(host.querySelectorAll('.outfit-card__approve').length).toBe(3);

    component.pendingDrafts = [{
      id: 'draft-1',
      batchId: 'batch-1',
      batchIndex: 0,
      status: 'PENDING',
      createdAt: 1,
      updatedAt: 1,
      generatedAt: 1,
      generatedBy: 'admin-1',
      model: 'fake',
      providerResponseId: null,
      request: preview.request,
      candidatesEvaluated: 3,
      imagesEvaluated: 3,
      usage: preview.usage,
      outfit: { ...preview.outfits[0] },
    }];
    fixture.detectChanges();
    expect(host.querySelector('.draft-card .alert-warning[role="status"]')?.textContent)
      .toContain('Capospalla non disponibile');
  });

  it('shows when the creator profile photo was used as visual identity reference', () => {
    service.generateOutfitPreview.and.returnValue(of({
      ...structuredClone(previewResult),
      creatorSnapshot: {
        uid: 'creator-d',
        displayName: 'Creator Donna',
        photoURL: 'https://example.test/avatar.jpg',
        visualIdentityApplied: true,
      },
    }));

    component.generate();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Identità visiva creator applicata');
    expect(fixture.nativeElement.textContent).toContain('Creator Donna');
  });

  it('sends an optional maximum total budget with the generation request', () => {
    component.outfitCount = 1;
    component.maxTotalPrice = 250;

    component.generate();

    expect(component.error).toBe('');
    expect(service.generateOutfitPreview).toHaveBeenCalledWith(jasmine.objectContaining({
      count: 1,
      maxTotalPrice: 250,
    }));
  });

  it('rejects an invalid maximum total budget before calling the backend', () => {
    service.generateOutfitPreview.calls.reset();
    component.maxTotalPrice = 0;

    component.generate();

    expect(component.error).toContain('tetto massimo');
    expect(service.generateOutfitPreview).not.toHaveBeenCalled();
  });

  it('allows generating a single outfit', () => {
    component.outfitCount = 1;
    service.generateOutfitPreview.and.returnValue(of({
      ...structuredClone(previewResult),
      request: { ...previewResult.request, count: 1 },
      outfits: [structuredClone(previewResult.outfits[0])],
    }));

    component.generate();

    expect(component.error).toBe('');
    expect(service.generateOutfitPreview).toHaveBeenCalledWith(jasmine.objectContaining({ count: 1 }));
    expect(component.result?.outfits.length).toBe(1);
  });

  it('publishes ids, canonical roles and normalized coordinates, then keeps the permanent image URL in the card', () => {
    component.generate();
    const outfit = component.result!.outfits[0];
    component.publish(outfit);
    fixture.detectChanges();

    expect(service.publishOutfitPreview).toHaveBeenCalledWith({
      title: 'Look 1',
      description: 'Descrizione 1',
      previewImageUrl: 'https://storage.test/look-1.png',
      gender: 'U',
      season: 'P',
      style: 'C',
      occasion: 'EVERYDAY',
      draftId: 'draft-1',
      products: [
        { catalogProductId: 'p-1-1', role: 'TOP', x: 0.38, y: 0.34 },
        { catalogProductId: 'p-1-2', role: 'BOTTOM', x: 0.62, y: 0.61 },
        { catalogProductId: 'p-1-3', role: 'SHOES', x: 0.42, y: 0.86 },
      ],
    });
    expect(component.publishedId(outfit)).toBe('outfit-1');
    expect(outfit.previewImageUrl).toBe('https://storage.test/outfits/ai/outfit-1.png');
    expect(fixture.nativeElement.textContent).toContain('Salvato in outfits');
  });

  it('passes selected source feeds only when present', () => {
    component.selectedFeedIds = ['feed-1', 'feed-2'];
    component.generate();
    expect(service.generateOutfitPreview).toHaveBeenCalledWith(jasmine.objectContaining({
      sourceFeedIds: ['feed-1', 'feed-2'],
    }));
  });

  it('discards a pending outfit and removes it from the current preview', () => {
    component.generate();
    spyOn(window, 'confirm').and.returnValue(true);
    const outfit = component.result!.outfits[0];
    component.discard(outfit);
    expect(service.discardOutfitDraft).toHaveBeenCalledWith('draft-1');
    expect(component.result!.outfits.length).toBe(2);
  });

  it('filters active creators by requested gender and clears incompatible selection', () => {
    component.onGenderChange('WOMAN');
    expect(component.availableCreators().map((creator) => creator.uid)).toEqual(['creator-d']);
    component.request.creatorUid = 'creator-d';
    component.onGenderChange('MAN');
    expect(component.request.creatorUid).toBeUndefined();
  });

  it('keeps loading until the expensive preview request completes', () => {
    const response$ = new Subject<AiOutfitPreviewResult>();
    service.generateOutfitPreview.and.returnValue(response$);

    component.generate();
    expect(component.loading).toBeTrue();

    response$.next(structuredClone(previewResult));
    response$.complete();
    expect(component.loading).toBeFalse();
  });

  it('explains backend editorial 422 codes without leaking unrelated data', () => {
    service.generateOutfitPreview.and.returnValue(throwError(() => ({
      status: 422,
      error: {
        message: 'La selezione AI non rispetta le regole editoriali. Nessuna immagine è stata generata.',
        issueCodes: ['MISSING_SHOES', 'MISSING_BASE', 'MISSING_SHOES', 'UNKNOWN_CODE'],
        catalogProductId: 'private-product-id',
      },
    })));
    component.generate();
    expect(component.result).toBeNull();
    expect(component.error).toContain('Mancano scarpe');
    expect(component.error).toContain('base completa');
    expect(component.error).toContain('[MISSING_SHOES]');
    expect(component.error.split('[MISSING_SHOES]').length).toBe(2);
    expect(component.error).not.toContain('UNKNOWN_CODE');
    expect(component.error).not.toContain('private-product-id');
  });

  it('exposes Fashion accessory roles for real-product and generic outfit generation', () => {
    expect(component.anchorRoles).toContain('BAG');
    expect(component.anchorRoles).toContain('ACCESSORY');
    expect(component.anchorRoles).toContain('HEADWEAR');
    expect(component.genericRole('A_Accessori', 'cinture')).toBe('ACCESSORY');
    expect(component.genericRole('A_Accessori', 'Borse_tracolla')).toBe('BAG');
    expect(component.genericRole('A_Accessori', 'cappelli')).toBe('HEADWEAR');
    expect(component.genericRole('A_Accessori', 'unknown')).toBeNull();
    component.anchorRole = 'BAG';
    component.anchorCategories = ['A_Accessori', 'scarpe'];
    expect(component.availableAnchorCategories).toEqual(['A_Accessori']);
  });

  it('keeps the safe backend message when editorial codes are missing or unknown', () => {
    expect(describeAiOutfitPreviewError({
      status: 422, error: { message: 'Messaggio editoriale', issueCodes: ['NOT_RECOGNIZED'] },
    })).toBe('Messaggio editoriale');
    expect(describeAiOutfitPreviewError({
      status: 502, error: { message: 'Provider unavailable', issueCodes: ['MISSING_SHOES'] },
    })).toBe('Provider unavailable');
    expect(describeAiOutfitPreviewError({
      status: 422, error: { issueCodes: ['ROLE_CATEGORY_MISMATCH', 'SEASON_SNOW_BOOTS'] },
    })).toContain('ruolo incompatibile');
  });

  it('surfaces the admin-only response without hiding the authorization problem', () => {
    service.generateOutfitPreview.and.returnValue(throwError(() => ({ status: 403 })));

    component.generate();

    expect(component.result).toBeNull();
    expect(component.error).toContain('amministratori');
    expect(component.loading).toBeFalse();
  });
  it('edits persisted metadata without regenerating AI and blocks stale-image approval', () => {
    component.generate();
    fixture.detectChanges();
    const outfit = component.result!.outfits[0];
    const draft = {
      id: 'draft-1',
      batchId: 'batch-1',
      batchIndex: 0,
      status: 'PENDING' as const,
      createdAt: 1,
      updatedAt: 1,
      generatedAt: 1,
      generatedBy: 'admin-1',
      model: 'gpt-5.6-terra',
      providerResponseId: null,
      request: { ...previewResult.request },
      candidatesEvaluated: 3,
      imagesEvaluated: 3,
      usage: previewResult.usage,
      outfit: structuredClone(outfit),
    };
    component.pendingDrafts = [draft];
    service.updateOutfitDraft.and.returnValue(of({
      ...draft,
      revision: 1,
      imageNeedsRegeneration: true,
      outfit: { ...outfit, title: 'Nuovo titolo' },
    }));
    fixture.detectChanges();
    const editor = fixture.debugElement.query(By.directive(AiOutfitDraftEditorComponent))
      .componentInstance as AiOutfitDraftEditorComponent;
    service.getProductCategories.and.returnValue(of(['cappotti', 'scarpe']));
    editor.startEditing();
    editor.form!.title = 'Nuovo titolo';
    editor.save();
    fixture.detectChanges();
    expect(service.updateOutfitDraft).toHaveBeenCalledWith('draft-1',
      jasmine.objectContaining({ title: 'Nuovo titolo', expectedRevision: 0 }));
    expect(service.regenerateOutfitDraftImage).not.toHaveBeenCalled();
    expect(component.result!.outfits[0].title).toBe('Nuovo titolo');
    expect(component.imageNeedsRefresh(component.result!.outfits[0])).toBeTrue();
    component.publish(component.result!.outfits[0]);
    expect(service.publishOutfitPreview).not.toHaveBeenCalled();
  });

  it('asks explicitly before the paid single image regeneration', () => {
    component.generate();
    fixture.detectChanges();
    const outfit = component.result!.outfits[0];
    const draft = {
      id: 'draft-1',
      batchId: 'batch-1',
      batchIndex: 0,
      status: 'PENDING' as const,
      createdAt: 1,
      updatedAt: 1,
      generatedAt: 1,
      generatedBy: 'admin-1',
      model: 'gpt-5.6-terra',
      providerResponseId: null,
      request: { ...previewResult.request },
      candidatesEvaluated: 3,
      imagesEvaluated: 3,
      usage: previewResult.usage,
      outfit: structuredClone(outfit),
      revision: 1,
      imageNeedsRegeneration: true,
    };
    component.pendingDrafts = [draft];
    service.regenerateOutfitDraftImage.and.returnValue(of({
      ...draft,
      revision: 2,
      imageNeedsRegeneration: false,
      outfit: { ...outfit, previewImageUrl: 'https://storage.test/new.png' },
    }));
    fixture.detectChanges();
    spyOn(window, 'confirm').and.returnValue(true);
    const editor = fixture.debugElement.query(By.directive(AiOutfitDraftEditorComponent))
      .componentInstance as AiOutfitDraftEditorComponent;
    editor.regenerateImage();
    expect(service.regenerateOutfitDraftImage).toHaveBeenCalledWith('draft-1', 1);
    expect(component.result!.outfits[0].previewImageUrl).toBe('https://storage.test/new.png');
    expect(component.imageNeedsRefresh(component.result!.outfits[0])).toBeFalse();
  });

});
