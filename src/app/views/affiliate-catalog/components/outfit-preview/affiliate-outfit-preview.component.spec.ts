import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { AffiliateCatalogService } from '../../services/affiliate-catalog.service';
import { AiOutfitPreviewResult } from '../../models/affiliate-catalog-api.models';
import { AffiliateOutfitPreviewComponent } from './affiliate-outfit-preview.component';

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
    title: `Look ${index}`,
    description: `Descrizione ${index}`,
    gender: 'U' as const,
    season: 'P' as const,
    style: 'C' as const,
    previewImageUrl: `https://storage.test/look-${index}.png`,
    products: [1, 2, 3].map((productIndex) => ({
      catalogProductId: `p-${index}-${productIndex}`,
      affiliateProgramId: index % 2 ? 'program-a' : 'program-b',
      role: `ruolo-${productIndex}`,
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
      ['generateOutfitPreview', 'getPrograms'],
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
    service.generateOutfitPreview.and.returnValue(of(previewResult));

    await TestBed.configureTestingModule({
      imports: [AffiliateOutfitPreviewComponent],
      providers: [{ provide: AffiliateCatalogService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(AffiliateOutfitPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('starts from the real baseline request and resolves program labels', () => {
    expect(component.request).toEqual({
      gender: 'MAN', season: 'SPRING', occasion: 'EVERYDAY', style: 'CASUAL',
    });
    expect(component.programLabel('program-a')).toBe('Merchant A');
    expect(component.programLabel('program-b')).toBe('program-b');
  });

  it('generates a batch and renders hero images next to real product references and usage', () => {
    component.generate();
    fixture.detectChanges();

    expect(service.generateOutfitPreview).toHaveBeenCalledWith(component.request);
    expect(component.result).toEqual(previewResult);
    expect(component.loading).toBeFalse();

    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelectorAll('.outfit-card').length).toBe(3);
    expect(host.querySelectorAll('.outfit-card__hero img').length).toBe(3);
    expect(host.querySelectorAll('.product-reference').length).toBe(9);
    expect(host.textContent).toContain('gpt-image-2.5-sunburst');
    expect(host.textContent).toContain('Merchant A');
  });

  it('keeps loading until the expensive preview request completes', () => {
    const response$ = new Subject<AiOutfitPreviewResult>();
    service.generateOutfitPreview.and.returnValue(response$);

    component.generate();
    expect(component.loading).toBeTrue();

    response$.next(previewResult);
    response$.complete();
    expect(component.loading).toBeFalse();
  });

  it('surfaces the admin-only response without hiding the authorization problem', () => {
    service.generateOutfitPreview.and.returnValue(throwError(() => ({ status: 403 })));

    component.generate();

    expect(component.result).toBeNull();
    expect(component.error).toContain('amministratori');
    expect(component.loading).toBeFalse();
  });
});
