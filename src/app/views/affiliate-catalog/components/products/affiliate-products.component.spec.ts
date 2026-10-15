import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { GridLoadRequest } from '../../../../core/public-api';
import { AuthService } from '../../../../services/auth.service';
import { PopUpService } from '../../../../core/popup/popup.service';
import { AffiliateProgram, CatalogProduct } from '../../models/affiliate-catalog.models';
import { AffiliateUnclassifiedCleanupJob } from '../../models/affiliate-catalog-api.models';
import { AffiliateCatalogService } from '../../services/affiliate-catalog.service';
import {
  AFFILIATE_PRODUCTS_PAGE_SIZE,
  AffiliateProductsComponent,
  buildAffiliateProductColumns,
  buildAffiliateProductGridRows,
  buildAffiliateProductRemoteRequest,
  affiliateProductSeasonsLabel,
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
    genderTargets: ['U', 'D'],
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

  const cleanupPreview: AffiliateUnclassifiedCleanupJob = {
    runId: '9aa49e50-3333-4444-8888-4e198cf5fe11',
    status: 'PREVIEW_READY',
    cursor: null,
    createdAt: 1000,
    updatedAt: 1002,
    completedAt: 1002,
    previewCompletedAt: 1002,
    taxonomyFingerprint: 'abc123',
    preview: {
      scanned: 100, unclassified: 25, eligible: 12,
      protectedManual: 4, protectedOutfits: 5, protectedShared: 4,
      variants: 15, offers: 14,
    },
    deleted: { products: 0, variants: 0, offers: 0, skippedProtected: 0 },
    lastError: null,
  };

  it('keeps the products grid read-only and exposes Programma, Categoria and Visibile app as filters', () => {
    const columns = buildAffiliateProductColumns([program], ['Clothing', 'Shoes'])[0].data;
    const actions = columns.filter((column) => column.type === 'campoButton');
    const filterable = columns.filter((column) => column.allowFiltering === true);

    expect(actions.map((column) => column.button?.name)).toEqual(['detail']);
    expect(buildAffiliateProductColumns([program], ['Clothing'], true)[0].data.filter((column) => column.type === 'campoButton')
      .map((column) => column.button?.name)).toEqual(['detail', 'edit', 'delete']);
    expect(columns.every((column) => column.allowEditing === false)).toBeTrue();
    expect(buildAffiliateProductColumns([program], ['Clothing'], true)[0].data.some((column) => column.button?.name === 'delete')).toBeTrue();
    expect(filterable.map((column) => column.dataField)).toEqual(['affiliateProgramId', 'category', 'visibleInAppFilter']);
    expect(filterable.every((column) => column.type === 'campoLista')).toBeTrue();
    expect(filterable[0].lista?.options).toEqual([{ id: program.id, name: program.name }]);
    expect(filterable[2].lista?.options).toEqual([
      { value: 'true', label: 'Sì' },
      { value: 'false', label: 'No' },
    ]);
  });

  it('maps program labels and display-only product summaries without changing canonical data', () => {
    const rows = buildAffiliateProductGridRows(
      [product],
      new Map([[program.id, program.name]]),
    );

    expect(rows[0].affiliateProgramId).toBe(program.id);
    expect(rows[0].programName).toBe(program.name);
    expect(rows[0].activeLabel).toBe('Sì');
    expect(rows[0].visibleInAppFilter).toBe('true');
    expect(buildAffiliateProductGridRows([{ ...product, active: false, enabledForApp: true }], new Map())[0].visibleInAppFilter).toBe('false');
    expect(rows[0].categoryLabel).toBe('Clothing / Shirts');
    expect(rows[0].genderLabel).toBe('U, D');
    expect(rows[0].seasonLabel).toBe('—');
    expect(affiliateProductSeasonsLabel(['WINTER', 'SPRING', 'WINTER'])).toBe('Primavera, Inverno');
    expect(rows[0].sourceFeedCount).toBe(2);
  });

  it('passes a chosen season to remote requests rather than filtering loaded rows locally', () => {
    expect(buildAffiliateProductRemoteRequest({ pageSize: 50 }, 'AUTUMN'))
      .toEqual({ limit: 50, season: 'AUTUMN' });
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
        { field: 'visibleInAppFilter', operator: 'eq', value: 'false' },
      ],
    };

    expect(buildAffiliateProductRemoteRequest(request)).toEqual({
      limit: AFFILIATE_PRODUCTS_PAGE_SIZE,
      cursor: 'cursor-2',
      affiliateProgramId: program.id,
      category: 'Clothing',
      visibleInApp: false,
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

  describe('component metadata, catalog cleanup and detail navigation', () => {
    let fixture: ComponentFixture<AffiliateProductsComponent>;
    let component: AffiliateProductsComponent;
    let service: jasmine.SpyObj<AffiliateCatalogService>;
    let router: Router;

    beforeEach(async () => {
      service = jasmine.createSpyObj<AffiliateCatalogService>('AffiliateCatalogService', [
        'getProducts',
        'getPrograms',
        'getProductCategories',
        'getUnclassifiedCleanupStatus',
        'previewUnclassifiedCleanup',
        'confirmUnclassifiedCleanup',
        'stopUnclassifiedCleanup',
      ]);
      service.getPrograms.and.returnValue(of([program]));
      service.getProductCategories.and.returnValue(of(['Clothing']));
      service.getProducts.and.returnValue(of({
        data: [product],
        pagination: { nextCursor: null, hasMore: false },
      }));
      service.getUnclassifiedCleanupStatus.and.returnValue(of(null));
      service.previewUnclassifiedCleanup.and.returnValue(of({ ...cleanupPreview, status: 'PREVIEWING' }));
      service.confirmUnclassifiedCleanup.and.returnValue(of({ ...cleanupPreview, status: 'RUNNING' }));
      service.stopUnclassifiedCleanup.and.returnValue(of({ ...cleanupPreview, status: 'STOP_REQUESTED' }));

      await TestBed.configureTestingModule({
        imports: [AffiliateProductsComponent],
        providers: [
          provideRouter([]),
          { provide: AffiliateCatalogService, useValue: service },
          { provide: AuthService, useValue: { isAdmin: () => true } },
          { provide: PopUpService, useValue: { setNewPopUp: () => {}, getOutputComponent: () => Promise.resolve({ name: 'cancelled' }), destroyCurrentOpenPopUpByGuid: () => {} } },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(AffiliateProductsComponent);
      component = fixture.componentInstance;
      router = TestBed.inject(Router);
    });

    it('loads reusable filter metadata without preloading a product page in the component', () => {
      component.refresh();

      expect(service.getPrograms).toHaveBeenCalledTimes(1);
      expect(service.getProductCategories).toHaveBeenCalledTimes(1);
      expect(service.getProducts).not.toHaveBeenCalled();
      expect(component.dataProvider).toBeDefined();
      expect(component.columns[0].data.find((column) => column.dataField === 'category')?.lista?.options)
        .toEqual([{ value: 'Clothing', label: 'Clothing' }]);
    });

    it('tracks mobile cards by the canonical product id', () => {
      expect(component.trackByProductId(0, product)).toBe(product.id);
    });

    it('opens the catalog cleanup panel and reads status without starting a destructive operation', () => {
      service.getUnclassifiedCleanupStatus.and.returnValue(of(cleanupPreview));

      component.openCleanupPanel();

      expect(component.cleanupPanelOpen).toBeTrue();
      expect(component.cleanupJob).toEqual(cleanupPreview);
      expect(service.getUnclassifiedCleanupStatus).toHaveBeenCalledTimes(1);
      expect(service.previewUnclassifiedCleanup).not.toHaveBeenCalled();
      expect(service.confirmUnclassifiedCleanup).not.toHaveBeenCalled();
    });

    it('starts only the preview when requested', () => {
      component.openCleanupPanel();
      component.requestCleanupPreview();

      expect(service.previewUnclassifiedCleanup).toHaveBeenCalledTimes(1);
      expect(component.cleanupJob?.status).toBe('PREVIEWING');
      expect(service.confirmUnclassifiedCleanup).not.toHaveBeenCalled();
    });

    it('requires a ready preview, verified backup and typed ELIMINA before enabling deletion', () => {
      service.getUnclassifiedCleanupStatus.and.returnValue(of(cleanupPreview));
      component.openCleanupPanel();

      expect(component.canConfirmCleanup()).toBeFalse();
      component.cleanupConfirmationText = 'ELIMINA';
      expect(component.canConfirmCleanup()).toBeFalse();
      component.cleanupBackupConfirmed = true;
      expect(component.canConfirmCleanup()).toBeTrue();

      // The network request can only be executed after the final confirmation dialog is accepted.
      expect(service.confirmUnclassifiedCleanup).not.toHaveBeenCalled();
      (component as any).executeCleanupDeletion(cleanupPreview.runId);
      expect(service.confirmUnclassifiedCleanup).toHaveBeenCalledOnceWith(cleanupPreview.runId);
      expect(component.cleanupJob?.status).toBe('RUNNING');
      expect(component.cleanupBackupConfirmed).toBeFalse();
      expect(component.cleanupConfirmationText).toBe('');
    });

    it('does not submit a deletion when no products are eligible', () => {
      service.getUnclassifiedCleanupStatus.and.returnValue(of({
        ...cleanupPreview, preview: { ...cleanupPreview.preview, eligible: 0 },
      }));
      component.openCleanupPanel();
      component.cleanupBackupConfirmed = true;
      component.cleanupConfirmationText = 'ELIMINA';

      expect(component.canConfirmCleanup()).toBeFalse();
      (component as any).executeCleanupDeletion(cleanupPreview.runId);
      expect(service.confirmUnclassifiedCleanup).not.toHaveBeenCalled();
    });

    it('requires confirmation of the current run before sending any deletion', () => {
      service.getUnclassifiedCleanupStatus.and.returnValue(of(cleanupPreview));
      component.openCleanupPanel();
      component.cleanupBackupConfirmed = true;
      component.cleanupConfirmationText = 'ELIMINA';

      (component as any).executeCleanupDeletion('stale-run-id');

      expect(service.confirmUnclassifiedCleanup).not.toHaveBeenCalled();
    });

    it('can stop a running cleanup and preserve its status', () => {
      service.getUnclassifiedCleanupStatus.and.returnValue(of({ ...cleanupPreview, status: 'RUNNING' }));
      component.openCleanupPanel();
      component.requestCleanupStop();

      expect(service.stopUnclassifiedCleanup).toHaveBeenCalledOnceWith(cleanupPreview.runId);
      expect(component.cleanupJob?.status).toBe('STOP_REQUESTED');
    });

    it('shows a clear error if the backend cleanup endpoint is not yet deployed', () => {
      service.getUnclassifiedCleanupStatus.and.returnValue(
        throwError(() => ({ status: 404 })),
      );
      component.openCleanupPanel();

      expect(component.cleanupError).toContain('backend aggiornato');
      expect(service.previewUnclassifiedCleanup).not.toHaveBeenCalled();
    });

    it('closing the cleanup panel disables confirmation and stops polling', () => {
      service.getUnclassifiedCleanupStatus.and.returnValue(of(cleanupPreview));
      component.openCleanupPanel();
      component.cleanupBackupConfirmed = true;
      component.cleanupConfirmationText = 'ELIMINA';

      component.closeCleanupPanel();

      expect(component.cleanupPanelOpen).toBeFalse();
      expect(component.canConfirmCleanup()).toBeFalse();
      expect(component.cleanupConfirmationText).toBe('');
      expect(component.cleanupBackupConfirmed).toBeFalse();
    });

    it('preserves active filters when navigating to the product detail', async () => {
      const navigate = spyOn(router, 'navigate').and.resolveTo(true);
      (component as any).dataGrid = {
        providerFilterValue: (field: string) => {
          if (field === 'affiliateProgramId') return program.id;
          if (field === 'category') return 'Clothing';
          if (field === 'visibleInAppFilter') return 'false';
          return undefined;
        },
      };

      await component.openDetail(product);

      expect(navigate.calls.argsFor(0)[1]).toEqual(jasmine.objectContaining({
        queryParams: {
          affiliateProgramId: program.id,
          category: 'Clothing',
          visibleInApp: 'false',
        },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      }));
      expect(navigate.calls.argsFor(1)).toEqual([
        ['/affiliate-catalog/products', product.id],
        { queryParamsHandling: 'preserve' },
      ]);
    });
  });
});