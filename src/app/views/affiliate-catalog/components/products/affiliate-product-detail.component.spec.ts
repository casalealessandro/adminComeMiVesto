import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { FORM_DEFINITION_REPOSITORY } from '../../../../core/forms/contracts/form-definition-repository';
import { FORM_OPTIONS_PROVIDER } from '../../../../core/forms/contracts/form-options-provider';
import { AffiliateFeed, AffiliateProgram, CatalogProduct } from '../../models/affiliate-catalog.models';
import { AffiliateCatalogService } from '../../services/affiliate-catalog.service';
import {
  AFFILIATE_PRODUCT_CURATION_FORM,
  AffiliateProductDetailComponent,
  affiliateProductDetailErrorMessage,
  buildAffiliateProductCurationFormData,
  buildAffiliateProductCurationUpdate,
  normalizeCatalogGenderTarget,
  normalizeCatalogGenderTargets,
} from './affiliate-product-detail.component';

describe('Affiliate product detail', () => {
  const program: AffiliateProgram = {
    id: 'program-1',
    network: 'TRADEDOUBLER',
    networkProgramId: 'external-program-1',
    name: 'Program 1',
    networkStatus: 'ACTIVE',
    enabled: true,
    defaultAdapterType: 'TRADEDOUBLER',
    market: 'IT',
    currency: 'EUR',
    priceSegment: 'MID_RANGE',
    createdAt: 1,
    updatedAt: 2,
  };

  const feed: AffiliateFeed = {
    id: 'feed-1',
    networkFeedId: 'external-feed-1',
    affiliateProgramId: program.id,
    name: 'Feed 1',
    enabled: true,
    adapterType: null,
    readMode: 'WHOLE_FEED',
    locale: 'it-IT',
    market: 'IT',
    lastSyncAt: null,
    lastSuccessfulSyncAt: null,
    lastTotalHits: null,
    lastError: null,
    createdAt: 1,
    updatedAt: 2,
  };

  const product: CatalogProduct = {
    id: 'product-1',
    affiliateProgramId: program.id,
    merchantProductGroupId: 'group-1',
    brand: 'Brand',
    name: 'Product',
    description: 'Description',
    genderTargets: ['D'],
    category: 'Clothing',
    subcategory: 'Shirts',
    normalizedColor: 'BLUE',
    materials: ['Cotton'],
    images: ['https://example.test/product.jpg'],
    sourceFeedIds: [feed.id],
    active: true,
    createdAt: 1,
    updatedAt: 2,
    lastSeenAt: 3,
  };

  function configure(service: jasmine.SpyObj<AffiliateCatalogService>) {
    const formRepository = {
      getFormFields: jasmine.createSpy('getFormFields').and.returnValue(of([])),
    };
    const formOptions = {
      getData: jasmine.createSpy('getData').and.resolveTo([]),
    };

    return TestBed.configureTestingModule({
      imports: [AffiliateProductDetailComponent],
      providers: [
        provideRouter([]),
        { provide: AffiliateCatalogService, useValue: service },
        { provide: FORM_DEFINITION_REPOSITORY, useValue: formRepository },
        { provide: FORM_OPTIONS_PROVIDER, useValue: formOptions },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: product.id }) } },
        },
      ],
    }).compileComponents();
  }

  it('loads the canonical product endpoint and prepares the dedicated DynamicForm data', async () => {
    const service = jasmine.createSpyObj<AffiliateCatalogService>('AffiliateCatalogService', [
      'getProduct', 'getProgram', 'getFeeds',
    ]);
    service.getProduct.and.returnValue(of(product));
    service.getProgram.and.returnValue(of(program));
    service.getFeeds.and.returnValue(of([feed]));
    await configure(service);

    const fixture = TestBed.createComponent(AffiliateProductDetailComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(service.getProduct).toHaveBeenCalledOnceWith(product.id);
    expect(service.getProgram).toHaveBeenCalledOnceWith(program.id);
    expect(service.getFeeds).toHaveBeenCalledOnceWith(program.id);
    expect(component.product).toEqual(product);
    expect(component.curationFormId).toBe(AFFILIATE_PRODUCT_CURATION_FORM);
    expect(component.curationData).toEqual({
      category: 'Clothing',
      subcategory: 'Shirts',
      normalizedColor: 'BLUE',
      genderTargets: ['D'],
    });
    expect(component.programName()).toBe(program.name);
    expect(component.sourceFeedName(feed.id)).toBe(feed.name);
  });

  it('keeps the product visible when program/feed lookups fail', async () => {
    const service = jasmine.createSpyObj<AffiliateCatalogService>('AffiliateCatalogService', [
      'getProduct', 'getProgram', 'getFeeds',
    ]);
    service.getProduct.and.returnValue(of(product));
    service.getProgram.and.returnValue(throwError(() => new Error('lookup failed')));
    service.getFeeds.and.returnValue(throwError(() => new Error('lookup failed')));
    await configure(service);

    const fixture = TestBed.createComponent(AffiliateProductDetailComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(component.product).toEqual(product);
    expect(component.program).toBeNull();
    expect(component.programName()).toBe(product.affiliateProgramId);
    expect(component.sourceFeedName(feed.id)).toBe(feed.id);
  });

  it('maps a missing product to a stable user-facing message', () => {
    expect(affiliateProductDetailErrorMessage(404)).toBe('Il prodotto richiesto non è più disponibile.');
  });

  it('normalizes form and legacy gender aliases to the backend U/D contract', () => {
    expect(normalizeCatalogGenderTarget('male')).toBe('U');
    expect(normalizeCatalogGenderTarget('Uomo')).toBe('U');
    expect(normalizeCatalogGenderTarget('female')).toBe('D');
    expect(normalizeCatalogGenderTarget('Donna')).toBe('D');
    expect(normalizeCatalogGenderTarget('unknown')).toBeNull();
    expect(normalizeCatalogGenderTargets(['male', 'U', 'female', 'D'])).toEqual(['U', 'D']);
  });

  it('normalizes legacy catalog values before passing editData to DynamicForm', () => {
    expect(buildAffiliateProductCurationFormData({
      ...product,
      genderTargets: ['male', 'U'],
    })).toEqual({
      category: 'Clothing',
      subcategory: 'Shirts',
      normalizedColor: 'BLUE',
      genderTargets: ['U'],
    });
  });

  it('builds only the changed backend fields from the DynamicForm submission', () => {
    expect(buildAffiliateProductCurationUpdate(product, true, {
      category: 'M_Maglieria',
      subcategory: 'felpe',
      normalizedColor: 'G',
      genderTargets: ['U'],
    })).toEqual({
      category: 'M_Maglieria',
      subcategory: 'felpe',
      normalizedColor: 'G',
      genderTargets: ['U'],
    });
  });

  it('can persist the visibility switch together with an unchanged DynamicForm', () => {
    expect(buildAffiliateProductCurationUpdate(product, false, {
      category: product.category,
      subcategory: product.subcategory,
      normalizedColor: product.normalizedColor,
      genderTargets: product.genderTargets,
    })).toEqual({ enabledForApp: false });
  });
});
