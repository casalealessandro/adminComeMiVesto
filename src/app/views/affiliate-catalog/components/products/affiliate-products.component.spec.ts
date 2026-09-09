import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AffiliateProgram, CatalogProduct } from '../../models/affiliate-catalog.models';
import { AffiliateCatalogService } from '../../services/affiliate-catalog.service';
import {
  AFFILIATE_PRODUCTS_PAGE_SIZE,
  AffiliateProductsComponent,
  buildAffiliateProductColumns,
  buildAffiliateProductGridRows,
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

  it('keeps the products grid read-only and free from action columns', () => {
    const columns = buildAffiliateProductColumns()[0].data;

    expect(columns.some((column) => column.type === 'campoButton')).toBeFalse();
    expect(columns.every((column) => column.allowEditing === false)).toBeTrue();
  });

  it('maps program labels and display-only product summaries', () => {
    const rows = buildAffiliateProductGridRows(
      [product],
      new Map([[program.id, program.name]]),
    );

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

  describe('cursor pagination', () => {
    let fixture: ComponentFixture<AffiliateProductsComponent>;
    let component: AffiliateProductsComponent;
    let service: jasmine.SpyObj<AffiliateCatalogService>;

    beforeEach(async () => {
      service = jasmine.createSpyObj<AffiliateCatalogService>('AffiliateCatalogService', [
        'getProducts',
        'getPrograms',
      ]);
      service.getPrograms.and.returnValue(of([program]));
      service.getProducts.and.returnValues(
        of({
          data: [product],
          pagination: { nextCursor: 'cursor-2', hasMore: true },
        }),
        of({
          data: [{ ...product, id: 'product-2', name: 'Product 2' }],
          pagination: { nextCursor: null, hasMore: false },
        }),
      );

      await TestBed.configureTestingModule({
        imports: [AffiliateProductsComponent],
        providers: [
          { provide: AffiliateCatalogService, useValue: service },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(AffiliateProductsComponent);
      component = fixture.componentInstance;
    });

    it('loads the first backend page with the canonical page size', () => {
      component.refresh();

      expect(service.getProducts).toHaveBeenCalledOnceWith({
        limit: AFFILIATE_PRODUCTS_PAGE_SIZE,
      });
      expect(component.products.length).toBe(1);
      expect(component.hasMore).toBeTrue();
      expect(component.nextCursor).toBe('cursor-2');
    });

    it('uses only the opaque nextCursor when loading the next page', () => {
      component.refresh();
      component.loadMore();

      expect(service.getProducts.calls.argsFor(1)).toEqual([{
        limit: AFFILIATE_PRODUCTS_PAGE_SIZE,
        cursor: 'cursor-2',
      }]);
      expect(component.products.map((item) => item.id)).toEqual(['product-1', 'product-2']);
      expect(component.hasMore).toBeFalse();
      expect(component.nextCursor).toBeNull();
    });
  });
});
