import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { AffiliateCatalogService } from './affiliate-catalog.service';
import { AiOutfitDraft, AiOutfitDraftEditRequest } from '../models/affiliate-catalog-api.models';

describe('AffiliateCatalogService AI outfit draft editing', () => {
  let service: AffiliateCatalogService;
  let http: HttpTestingController;
  const base = `${environment.apiBaseUrl}/admin/affiliate/outfit-generator/drafts`;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AffiliateCatalogService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('puts only the editable draft contract, never a client-controlled hero URL or price', () => {
    const input: AiOutfitDraftEditRequest = {
      expectedRevision: 0, title: 'Ufficio', description: 'Casual curato', gender: 'U',
      season: 'P', style: 'C', occasion: 'OFFICE',
      products: [
        { catalogProductId: 'p1', role: 'TOP', x: .4, y: .3 },
        { catalogProductId: 'p2', role: 'BOTTOM', x: .5, y: .6 },
        { catalogProductId: 'p3', role: 'SHOES', x: .5, y: .9 },
      ],
    };
    const updated = { id: 'draft-1', revision: 1, imageNeedsRegeneration: true } as AiOutfitDraft;
    let result: AiOutfitDraft | undefined;
    service.updateOutfitDraft('draft-1', input).subscribe((value) => result = value);
    const request = http.expectOne(`${base}/draft-1`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(input);
    expect(request.request.body.previewImageUrl).toBeUndefined();
    request.flush({ data: updated });
    expect(result).toEqual(updated);
  });

  it('explicitly requests regeneration of one draft image by revision', () => {
    const updated = { id: 'draft-1', revision: 2, imageNeedsRegeneration: false } as AiOutfitDraft;
    let result: AiOutfitDraft | undefined;
    service.regenerateOutfitDraftImage('draft-1', 1).subscribe((value) => result = value);
    const request = http.expectOne(`${base}/draft-1/regenerate-image`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ expectedRevision: 1 });
    request.flush({ data: updated });
    expect(result).toEqual(updated);
  });
});
