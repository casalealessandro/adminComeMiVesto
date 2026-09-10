import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AffiliateCatalogAudit } from '../../models/affiliate-catalog-audit.models';
import { AffiliateCatalogService } from '../../services/affiliate-catalog.service';
import { AffiliateCatalogAuditComponent, auditPercentage } from './affiliate-catalog-audit.component';

describe('AffiliateCatalogAuditComponent', () => {
  const audit: AffiliateCatalogAudit = {
    generatedAt: 1000,
    catalog: {
      summary: { total: 10, active: 8, inactive: 2, withoutCategory: 1 },
      dataQuality: {
        withImages: 9,
        withoutImages: 1,
        withGenderTargets: 7,
        withoutGenderTargets: 3,
        withNormalizedColor: 6,
        withoutNormalizedColor: 4,
      },
      categories: [{
        category: 'Clothing',
        totalProducts: 8,
        activeProducts: 7,
        withImages: 8,
        withGender: 6,
        withColor: 5,
        subcategories: [{
          subcategory: 'Shirts',
          totalProducts: 4,
          activeProducts: 4,
          withImages: 4,
          withGender: 3,
          withColor: 2,
        }],
      }],
    },
    comeMiVestoCategories: [
      { id: 'clothing', categoryName: 'Abbigliamento', parentCategory: null, parentCategoryName: null, gender: ['M', 'D'], status: true, order: 1 },
      { id: 'shirts', categoryName: 'Camicie', parentCategory: 'clothing', parentCategoryName: 'Abbigliamento', gender: ['M'], status: true, order: 2 },
      { id: 'orphan', categoryName: 'Orfana', parentCategory: 'missing', parentCategoryName: null, gender: null, status: false, order: 3 },
    ],
  };

  it('calculates bounded percentages safely', () => {
    expect(auditPercentage(8, 10)).toBe(80);
    expect(auditPercentage(1, 0)).toBe(0);
    expect(auditPercentage(20, 10)).toBe(100);
  });

  describe('data loading', () => {
    let fixture: ComponentFixture<AffiliateCatalogAuditComponent>;
    let component: AffiliateCatalogAuditComponent;
    let service: jasmine.SpyObj<AffiliateCatalogService>;

    beforeEach(async () => {
      service = jasmine.createSpyObj<AffiliateCatalogService>('AffiliateCatalogService', ['getCatalogAudit']);
      service.getCatalogAudit.and.returnValue(of(audit));

      await TestBed.configureTestingModule({
        imports: [AffiliateCatalogAuditComponent],
        providers: [{ provide: AffiliateCatalogService, useValue: service }],
      }).compileComponents();

      fixture = TestBed.createComponent(AffiliateCatalogAuditComponent);
      component = fixture.componentInstance;
    });

    it('loads the backend audit and exposes the taxonomy hierarchy', () => {
      fixture.detectChanges();

      expect(service.getCatalogAudit).toHaveBeenCalledTimes(1);
      expect(component.audit).toEqual(audit);
      expect(component.rootCategories.map((category) => category.id)).toEqual(['clothing']);
      expect(component.childrenFor('clothing').map((category) => category.id)).toEqual(['shirts']);
      expect(component.orphanCategories.map((category) => category.id)).toEqual(['orphan']);
    });

    it('shows a recoverable error when the audit endpoint fails', () => {
      service.getCatalogAudit.and.returnValue(throwError(() => new Error('failed')));

      component.refresh();

      expect(component.audit).toBeNull();
      expect(component.error).toContain('Impossibile caricare');
      expect(component.loading).toBeFalse();
    });
  });
});
