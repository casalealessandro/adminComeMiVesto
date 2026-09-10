import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { AffiliateCatalogAudit } from '../models/affiliate-catalog-audit.models';
import { AffiliateCatalogService } from './affiliate-catalog.service';

describe('AffiliateCatalogService catalog audit contract', () => {
  let service: AffiliateCatalogService;
  let http: HttpTestingController;
  const url = `${environment.apiBaseUrl}/admin/affiliate/catalog-audit`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AffiliateCatalogService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the read-only catalog audit and unwraps the backend data envelope', () => {
    const audit: AffiliateCatalogAudit = {
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
        categories: [],
      },
      comeMiVestoCategories: [],
    };

    let response: AffiliateCatalogAudit | undefined;
    service.getCatalogAudit().subscribe((value) => response = value);

    const request = http.expectOne(url);
    expect(request.request.method).toBe('GET');
    expect(request.request.body).toBeNull();
    request.flush({ data: audit });

    expect(response).toEqual(audit);
  });
});
