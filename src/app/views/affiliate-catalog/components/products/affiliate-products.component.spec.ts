import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { GridLoadRequest } from '../../../../core/public-api';
import { AffiliateProgram, CatalogProduct } from '../../models/affiliate-catalog.models';
import { AffiliateCatalogService } from '../../services/affiliate-catalog.service';
import {
  AFFILIATE_PRODUCTS_PAGE_SIZE,
  AffiliateProductsComponent,
  buildAffiliateProductColumns,
  buildAffiliateProductGridRows,
  buildAffiliateProductRemoteRequest,
  createAffiliateProductsProvider,
} from './affiliate-products.component';

describe('Affiliate products', () => {
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

  const product: CatalogProduct = {
    id: 'product-1',
    affiliateProgramId: program.id,
    merchantProductGroupId: 'group-1',
    brand: 'Brand',
    name: 'Product',
    description: 'Description',
    genderTargets: ['WOMEN', 'UNISEX'],
    category: 'Clothing',
    subcategory: 'Shirts',
    normalizedColor: 'BLUE',
    materials: ['Cotton'],
    images: ['https://example.test/product.jpg'],
    sourceFeedIds: ['feed-1', 'feed-2'],
    active: true,
    createdAt: 1,
    updatedAt: 2,
    lastSeenAt: 3,
  };

  const taxonomyPreview = {
    scanned: 10,
    eligible: 8,
    suggested: 2,
    ambiguous: 1,
    noMatch: 5,
    invalidCategory: 2,
    updated: 0,
    preview: [{
      productId: 'product-2',
      productName: 'Pantalone cargo',
      category: 'pants-parent',
      suggestedSubcategory: 'cargo-child',
      suggestedSubcategoryName: 'Cargo',
      matchedText: 'Cargo',
    }],
    previewTruncated: false,
  };

  it('keeps the products grid read-only and exposes only Programma and Categoria as filters', () => {
    const columns = buildAffiliateProductColumns([program], ['Clothing', 'Shoes'])[0].data;
    const actions = columns.filter((column) => column.type === 'campoButton');
    const filterable = columns.filter((column) => column.allowFiltering === true);

    expect(actions.map((column) => column.button?.name)).toEqual(['detail']);
    expect(columns.every((column) => column.allowEditing === false)).toBeTrue();
    expect(filterable.map((column) => column.dataField)).toEqual(['affiliateProgramId', 'category']);
    expect(filterable.every((column) => column.type === 'campoLista')).toBeTrue();
    expect(filterable[0].lista?.options).toEqual([{ id: program.id, name: program.name }]);
  });

  it('maps program labels and display-only product summaries without changing canonical data', () => {
    const rows = buildAffiliateProductGridRows(
      [product],
      new Map([[program.id, program.name]]),
    );

    expect(rows[0].affiliateProgramId).toBe(program.id);
    expect(rows[0].programName).toBe(program.name);
    expect(rows[0].activeLabel).toBe('Sì');
    expect(rows[0].categoryLabel).toBe('Clothing / Shirts');
    expect(rows[0].genderLabel).toBe('WOMEN, UNISEX');
    expect(rows[0].sourceFeedCount).toBe(2);
  });

  it('falls back to the canonical program id when program lookup is unavailable', () => {
    const rows = buildAffiliateProductGridRows([product], new Map());
    expect(rows[0].programName).toBe(program.id);
  });

  it('translates DataGrid continuation and exact column filters into the products API contract', () => {
    const request: GridLoadRequest = {
      pageSize: AFFILIATE_PRODUCTS_PAGE_SIZE,
      continuation: 'cursor-2',
      filters: [
        { field: 'affiliateProgramId', operator: 'eq', value: program.id },
        { field: 'category', operator: 'eq', value: 'Clothing' },
      ],
    };

    expect(buildAffiliateProductRemoteRequest(request)).toEqual({
      limit: AFFILIATE_PRODUCTS_PAGE_SIZE,
      cursor: 'cursor-2',
      affiliateProgramId: program.id,
      category: 'Clothing',
    });
  });

  it('maps backend cursor pages into the provider-neutral DataGrid page', async () => {
    const service = jasmine.createSpyObj<AffiliateCatalogService>('AffiliateCatalogService', ['getProducts']);
    service.getProducts.and.returnValue(of({
      data: [product],
      pagination: { nextCursor: 'cursor-2', hasMore: true },
    }));
    const onPage = jasmine.createSpy('onPage');
    const provider = createAffiliateProductsProvider(
      service,
      new Map([[program.id, program.name]]),
      { onPage },
    );

    const page = await provider.load({
      pageSize: AFFILIATE_PRODUCTS_PAGE_SIZE,
      filters: [{ field: 'affiliateProgramId', operator: 'eq', value: program.id }],
    });

    expect(service.getProducts).toHaveBeenCalledOnceWith({
      limit: AFFILIATE_PRODUCTS_PAGE_SIZE,
      affiliateProgramId: program.id,
    });
    expect(page.items[0].programName).toBe(program.name);
    expect(page.hasMore).toBeTrue();
    expect(page.continuation).toBe('cursor-2');
    expect(onPage).toHaveBeenCalledWith([product], false, true);
  });

  describe('component metadata, taxonomy repair and detail navigation', () => {
    let fixture: ComponentFixture<AffiliateProductsComponent>;
    let component: AffiliateProductsComponent;
    let service: jasmine.SpyObj<AffiliateCatalogService>;
    let router: Router;

    beforeEach(async () => {
      service = jasmine.createSpyObj<AffiliateCatalogService>('AffiliateCatalogService', [
        'getProducts',
        'getPrograms',
        'getCatalogAudit',
        'repairProductTaxonomies',
      ]);
      service.getPrograms.and.returnValue(of([program]));
      service.getCatalogAudit.and.returnValue(of({
        generatedAt: 1,
        catalog: {
          summary: { total: 1, active: 1, inactive: 0, withoutCategory: 0 },
          dataQuality: {
            withImages: 1,
            withoutImages: 0,
            withGenderTargets: 1,
            withoutGenderTargets: 0,
            withNormalizedColor: 1,
            withoutNormalizedColor: 0,
          },
          categories: [{
            category: 'Clothing',
            totalProducts: 1,
            activeProducts: 1,
            withImages: 1,
            withGender: 1,
            withColor: 1,
            subcategories: [],
          }],
        },
        comeMiVestoCategories: [],
      }));
      service.getProducts.and.returnValue(of({
        data: [product],
        pagination: { nextCursor: null, hasMore: false },
      }));
      service.repairProductTaxonomies.and.returnValue(of(taxonomyPreview));

      await TestBed.configureTestingModule({
        imports: [AffiliateProductsComponent],
        providers: [
          provideRouter([]),
          { provide: AffiliateCatalogService, useValue: service },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(AffiliateProductsComponent);
      component = fixture.componentInstance;
      router = TestBed.inject(Router);
    });

    it('loads reusable filter metadata without preloading a product page in the component', () => {
      component.refresh();

      expect(service.getPrograms).toHaveBeenCalledTimes(1);
      expect(service.getCatalogAudit).toHaveBeenCalledTimes(1);
      expect(service.getProducts).not.toHaveBeenCalled();
      expect(component.dataProvider).toBeDefined();
      expect(component.columns[0].data.find((column) => column.dataField === 'category')?.lista?.options)
        .toEqual([{ value: 'Clothing', label: 'Clothing' }]);
    });

    it('tracks mobile cards by the canonical product id', () => {
      expect(component.trackByProductId(0, product)).toBe(product.id);
    });

    it('analyzes missing taxonomies without applying changes', () => {
      component.analyzeMissingTaxonomies();

      expect(service.repairProductTaxonomies).toHaveBeenCalledOnceWith(false);
      expect(component.taxonomyRepair).toEqual(taxonomyPreview);
    });

    it('applies only after an explicit preview and refreshes products when updates were written', () => {
      component.taxonomyRepair = taxonomyPreview;
      service.repairProductTaxonomies.and.returnValue(of({ ...taxonomyPreview, updated: 2 }));
      const refresh = spyOn(component, 'refresh');

      component.applyTaxonomySuggestions();

      expect(service.repairProductTaxonomies).toHaveBeenCalledOnceWith(true);
      expect(component.taxonomyRepair?.updated).toBe(2);
      expect(refresh).toHaveBeenCalledTimes(1);
    });

    it('does not call apply when there are no safe suggestions', () => {
      component.taxonomyRepair = { ...taxonomyPreview, suggested: 0, preview: [] };

      component.applyTaxonomySuggestions();

      expect(service.repairProductTaxonomies).not.toHaveBeenCalled();
    });

    it('navigates to the canonical product detail route', () => {
      const navigate = spyOn(router, 'navigate').and.resolveTo(true);

      component.openDetail(product);

      expect(navigate).toHaveBeenCalledWith(['/affiliate-catalog/products', product.id]);
    });
  });
});