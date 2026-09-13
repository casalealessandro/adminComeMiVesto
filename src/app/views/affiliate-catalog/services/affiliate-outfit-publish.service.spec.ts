import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { AiOutfitPublishRequest, AiOutfitPublishedResult } from '../models/ai-outfit-publish.models';
import { AffiliateCatalogService } from './affiliate-catalog.service';

describe('AffiliateCatalogService AI outfit publish', () => {
  let service: AffiliateCatalogService;
  let http: HttpTestingController;
  const endpoint = `${environment.apiBaseUrl}/admin/affiliate/outfit-generator/publish`;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AffiliateCatalogService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('posts only the publish contract and unwraps the persisted outfit', () => {
    const input: AiOutfitPublishRequest = {
      title: 'Look 1',
      description: 'Descrizione',
      previewImageUrl: 'https://storage.test/preview.png',
      gender: 'U',
      season: 'P',
      style: 'C',
      products: [
        { catalogProductId: 'p1', role: 'top' },
        { catalogProductId: 'p2', role: 'bottom' },
        { catalogProductId: 'p3', role: 'shoes' },
      ],
    };
    const result: AiOutfitPublishedResult = {
      id: 'outfit-1',
      title: input.title,
      imageUrl: 'https://storage.test/permanent.png',
      status: 'approved',
      userId: 'comemivesto-ai-outfit',
      createdAt: 1,
    };

    let response: AiOutfitPublishedResult | undefined;
    service.publishOutfitPreview(input).subscribe((value) => response = value);

    const request = http.expectOne(endpoint);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(input);
    request.flush({ data: result });
    expect(response).toEqual(result);
  });
});
